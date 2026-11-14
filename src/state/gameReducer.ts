import type { GameAction, GameState } from './gameTypes';
import { validateMissionConfiguration } from '../services/validation/missionDesign';
import { validateSpacecraftSelection } from '../services/calculations/spacecraftDesign';
import {
  advanceMissionSimulation,
  completeMissionSimulation,
  confirmMissionLanding,
  recordLandingFailure,
  runMissionScience,
  startMissionSimulation,
  transmitMissionData,
} from '../services/simulation/missionSimulation';
import { resolveMissionEventDecision } from '../services/missionEvents';
import { evaluateMissionPerformance } from '../services/scoring/missionScoring';
import { createChapterAchievements, createMissionAchievements, mergeAchievementRecords } from '../services/achievements';
import { initialGameState } from './gameState';
import { academyChapters } from '../data/academy';
import { MISSION_FUNDING_ALLOCATION_USD } from '../services/budgetAllocation';

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_STAGE':
      return {
        ...state,
        mission: {
          ...state.mission,
          stage: action.stage,
        },
      };
    case 'SET_PLAYER_MODE':
      return {
        ...state,
        playerMode: action.mode,
      };
    case 'UPDATE_PLAYER':
      return {
        ...state,
        player: {
          ...state.player,
          ...action.payload,
        },
      };
    case 'SET_TEAM':
      return {
        ...state,
        team: {
          ...action.team,
          isConfirmed: false,
          confirmedAt: null,
        },
      };
    case 'CLEAR_TEAM':
      return { ...state, team: null };
    case 'CONFIRM_TEAM': {
      const team = state.team;
      const roles = team?.participants.map((participant) => participant.role) ?? [];
      const hasValidRoster = Boolean(
        team &&
          team.name.trim() &&
          team.participants.length > 0 &&
          team.participants.length <= 4 &&
          team.participants.every((participant) => participant.name.trim()) &&
          new Set(roles).size === roles.length,
      );

      if (!team || !hasValidRoster) {
        return state;
      }

      return {
        ...state,
        team: {
          ...team,
          isConfirmed: true,
          confirmedAt: action.confirmedAt,
        },
      };
    }
    case 'ADD_DECISION':
      if (
        !state.team?.isConfirmed ||
        !state.team.participants.some((participant) => participant.id === action.decision.proposedByPlayerId) ||
        state.decisionHistory.some((decision) => decision.id === action.decision.id)
      ) {
        return state;
      }

      return {
        ...state,
        decisionHistory: [action.decision, ...state.decisionHistory],
      };
    case 'CAST_DECISION_VOTE': {
      const team = state.team;
      const decision = state.decisionHistory.find((item) => item.id === action.decisionId);
      const isParticipant = team?.participants.some((participant) => participant.id === action.playerId);

      if (!team?.isConfirmed || !decision || decision.status !== 'pending' || !isParticipant) {
        return state;
      }

      const votes = [
        ...decision.votes.filter((vote) => vote.playerId !== action.playerId),
        { playerId: action.playerId, choice: action.choice, castAt: action.castAt },
      ];
      const isRejected = votes.some((vote) => vote.choice === 'reject');
      const isApproved = votes.length === team.participants.length && votes.every((vote) => vote.choice === 'approve');
      const status = isRejected ? 'rejected' : isApproved ? 'approved' : 'pending';

      return {
        ...state,
        decisionHistory: state.decisionHistory.map((item) =>
          item.id === action.decisionId
            ? { ...item, votes, status, resolvedAt: status === 'pending' ? null : action.castAt }
            : item,
        ),
      };
    }
    case 'UPDATE_MISSION_CONFIGURATION': {
      const startsDifferentMission = Boolean(
        state.missionConfiguration &&
          (state.missionConfiguration.missionName.trim().toLowerCase() !== action.configuration.missionName.trim().toLowerCase() ||
            state.missionConfiguration.destination !== action.configuration.destination),
      );
      return {
        ...state,
        missionConfiguration: {
          ...action.configuration,
          isConfirmed: false,
          updatedAt: new Date().toISOString(),
        },
        ...(startsDifferentMission ? {
          missionEngineeringAdjustments: {
            instrumentPowerMultiplier: 1,
            scienceOutputMultiplier: 1,
            dataVolumeMultiplier: 1,
            communicationCapacityMultiplier: 1,
            missionDurationDeltaDays: 0,
            missionExpenseDeltaUsd: 0,
            prioritizedObjectiveId: null,
          },
        } : {}),
        selectedMissionId: null,
      };
    }
    case 'CONFIRM_MISSION_CONFIGURATION': {
      if (!state.missionConfiguration || !validateMissionConfiguration(state.missionConfiguration).isValid) {
        return state;
      }

      return {
        ...state,
        missionConfiguration: {
          ...state.missionConfiguration,
          isConfirmed: true,
          updatedAt: action.confirmedAt,
        },
        selectedMissionId: state.missionConfiguration.destination,
      };
    }
    case 'SET_SPACECRAFT_COMPONENTS':
      if (!validateSpacecraftSelection(action.componentIds, state.missionConfiguration).isValid) {
        return state;
      }

      return {
        ...state,
        selectedSpacecraftComponentIds: [...action.componentIds],
      };
    case 'SET_INSTRUMENTS':
      return {
        ...state,
        selectedInstrumentIds: [...new Set(action.instrumentIds)],
      };
    case 'SET_LAUNCH_CONFIGURATION':
      return {
        ...state,
        selectedLaunchVehicleId: action.launchVehicleId,
        selectedTrajectoryId: action.trajectoryId,
      };
    case 'UPDATE_RESOURCE_PLAN':
      return { ...state, resourcePlan: { ...state.resourcePlan, ...action.payload } };
    case 'RESOLVE_MISSION_EVENT':
      return resolveMissionEventDecision(state, action.eventId, action.decisionId);
    case 'RECORD_MISSION_EVALUATION':
      if (state.missionEvaluationHistory.some((item) => item.id === action.evaluation.id)) return state;
      return {
        ...state,
        missionEvaluationHistory: [action.evaluation, ...state.missionEvaluationHistory],
        achievementRecords: mergeAchievementRecords(state.achievementRecords, createMissionAchievements(action.evaluation, action.evaluation.completedAt)),
      };
    case 'COMPLETE_ACADEMY_CHAPTER': {
      if (!academyChapters.some((chapter) => chapter.id === action.chapterId) || state.completedChapterIds.includes(action.chapterId)) return state;
      const completedChapterIds = [...state.completedChapterIds, action.chapterId];
      return {
        ...state,
        completedChapterIds,
        achievementRecords: mergeAchievementRecords(state.achievementRecords, createChapterAchievements(completedChapterIds, new Date().toISOString())),
      };
    }
    case 'START_NEW_MISSION':
      return {
        ...state,
        decisionHistory: [],
        missionConfiguration: null,
        selectedSpacecraftComponentIds: [],
        selectedInstrumentIds: [],
        selectedLaunchVehicleId: null,
        selectedTrajectoryId: null,
        resourcePlan: { initialFundingUsd: MISSION_FUNDING_ALLOCATION_USD, missionExpensesUsd: 0 },
        missionEngineeringAdjustments: { ...initialGameState.missionEngineeringAdjustments },
        missionEventDecisionHistory: [],
        missionSimulation: null,
        mission: { ...initialGameState.mission, stage: 'mission-design' },
        selectedMissionId: null,
      };
    case 'RESET_PROGRESS':
      return { ...initialGameState, isLoaded: true };
    case 'START_MISSION_SIMULATION': {
      const missionSimulation = startMissionSimulation(state);
      return missionSimulation ? { ...state, missionSimulation } : state;
    }
    case 'RECORD_LANDING_FAILURE': {
      const missionSimulation = recordLandingFailure(state.missionSimulation);
      if (!missionSimulation || missionSimulation === state.missionSimulation) return state;
      if (missionSimulation.status !== 'completed') return { ...state, missionSimulation };
      const evaluation = evaluateMissionPerformance(state, missionSimulation);
      const scoredSimulation = { ...missionSimulation, performanceScore: evaluation.overallScore, resultSummary: evaluation.debrief };
      return {
        ...state,
        missionSimulation: scoredSimulation,
        missionEvaluationHistory: [evaluation, ...state.missionEvaluationHistory.filter((item) => item.id !== evaluation.id)],
        mission: { ...state.mission, readiness: evaluation.overallScore, alerts: missionSimulation.events.filter((event) => event.severity === 'warning').length },
      };
    }
    case 'CONFIRM_MISSION_LANDING': {
      const missionSimulation = confirmMissionLanding(state.missionSimulation);
      return missionSimulation ? { ...state, missionSimulation } : state;
    }
    case 'ADVANCE_MISSION_SIMULATION':
      return { ...state, missionSimulation: advanceMissionSimulation(state.missionSimulation) };
    case 'RUN_MISSION_SCIENCE':
      return { ...state, missionSimulation: runMissionScience(state.missionSimulation) };
    case 'TRANSMIT_MISSION_DATA':
      return { ...state, missionSimulation: transmitMissionData(state.missionSimulation) };
    case 'COMPLETE_MISSION_SIMULATION': {
      if (state.missionSimulation?.status === 'completed') return state;
      const missionSimulation = completeMissionSimulation(state.missionSimulation);
      if (!missionSimulation || missionSimulation.status !== 'completed') return state;
      const evaluation = evaluateMissionPerformance(state, missionSimulation);
      const scoredSimulation = {
        ...missionSimulation,
        performanceScore: evaluation.overallScore,
        resultSummary: evaluation.debrief,
      };
      return {
        ...state,
        missionSimulation: scoredSimulation,
        missionEvaluationHistory: [evaluation, ...state.missionEvaluationHistory.filter((item) => item.id !== evaluation.id)],
        achievementRecords: mergeAchievementRecords(state.achievementRecords, createMissionAchievements(evaluation, evaluation.completedAt)),
        mission: {
          ...state.mission,
          readiness: evaluation.overallScore,
          alerts: missionSimulation.events.filter((event) => event.severity === 'warning').length,
        },
      };
    }
    case 'SET_MISSION':
      return {
        ...state,
        mission: {
          ...state.mission,
          ...action.payload,
        },
      };
    case 'SELECT_MISSION':
      return {
        ...state,
        selectedMissionId: action.missionId,
      };
    case 'LOAD_STATE':
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
}
