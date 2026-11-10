import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function notFound(message: string) {
  return Object.assign(new Error(message), { status: 404 });
}

function normalizeString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw badRequest(`${field} is required`);
  }
  return value.trim();
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw badRequest('Activity payload is required');
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  const cleanedType = normalizeString(type, 'Activity type');

  if (typeof minutes !== 'number' || Number.isNaN(minutes) || minutes <= 0) {
    throw badRequest('Activity minutes must be a positive number');
  }

  if (!mongoose.isValidObjectId(userId)) {
    throw badRequest('A valid userId is required');
  }
  if (!mongoose.isValidObjectId(teamId)) {
    throw badRequest('A valid teamId is required');
  }

  const userObjectId = new mongoose.Types.ObjectId(String(userId));
  const teamObjectId = new mongoose.Types.ObjectId(String(teamId));
  const [userExists, teamExists] = await Promise.all([
    User.exists({ _id: userObjectId }),
    Team.exists({ _id: teamObjectId }),
  ]);

  if (!userExists || !teamExists) {
    throw badRequest('User and team must both exist');
  }

  const points = Math.max(1, Math.round(minutes));
  return Activity.create({
    user: userObjectId,
    team: teamObjectId,
    type: cleanedType,
    minutes,
    points,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().sort({ name: 1 }).lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw badRequest('Team payload is required');
  }

  const { name, mascot, members } = input as Record<string, unknown>;
  const cleanName = normalizeString(name, 'Team name');
  const cleanMascot = normalizeString(mascot, 'Team mascot');

  const normalizedMembers = Array.isArray(members) ? members : [];
  const validMembers = normalizedMembers.map((member) => {
    if (typeof member !== 'string' || !mongoose.isValidObjectId(member)) {
      throw badRequest('Team members must contain valid user IDs');
    }
    return new mongoose.Types.ObjectId(member);
  });

  return Team.create({
    name: cleanName,
    mascot: cleanMascot,
    members: validMembers,
  });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);

  const teamIds = totals.map((entry) => entry._id);
  const teams = await Team.find({ _id: { $in: teamIds } }).lean();
  const teamMap = new Map(teams.map((team) => [team._id.toString(), team.name]));

  return totals
    .map((entry, index) => ({
      teamName: teamMap.get(entry._id.toString()) ?? 'Unknown team',
      totalPoints: Number(entry.totalPoints),
      rank: index + 1,
    }))
    .filter((entry) => entry.teamName !== 'Unknown team');
}

export async function suggestWorkouts(userEmail: string) {
  const normalizedEmail = normalizeString(userEmail, 'User email');
  const user = await User.findOne({ email: normalizedEmail.toLowerCase() }).lean();
  if (!user) {
    throw notFound('User not found');
  }

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const preferredFocus = normalizeString(user.fitnessGoal ?? recentActivity?.type ?? 'endurance', 'Workout focus');

  const workouts = await Workout.find().lean();
  const scored = workouts
    .map((workout) => {
      const focusMatch = workout.focus === preferredFocus ? 3 : workout.focus === recentActivity?.type ? 2 : 0;
      const reason = workout.focus === preferredFocus
        ? `Matches your ${preferredFocus} goal${recentActivity ? ` and recent ${recentActivity.type} activity` : ''}.`
        : recentActivity && workout.focus === recentActivity.type
          ? `Aligns with your recent ${recentActivity.type} activity.`
          : `Builds overall ${preferredFocus} fitness.`;

      return { ...workout, _score: focusMatch, reason };
    })
    .sort((left, right) => Number(right._score) - Number(left._score) || String(left.title).localeCompare(String(right.title)));

  return scored.slice(0, 3).map(({ _score, ...workout }) => ({
    ...workout,
    reason: workout.reason,
  }));
}

export { User };
