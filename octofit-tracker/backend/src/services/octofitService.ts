import { Activity, Team, User, Workout } from '../models/index.js';

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw Object.assign(new Error('Activity input must be an object'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (!isObjectId(userId) || !isObjectId(teamId)) {
    throw Object.assign(new Error('Valid userId and teamId are required'), { status: 400 });
  }
  if (typeof type !== 'string' || !type.trim() || typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw Object.assign(new Error('Activity type and positive minutes are required'), { status: 400 });
  }

  const [user, team] = await Promise.all([User.exists({ _id: userId }), Team.exists({ _id: teamId })]);
  if (!user || !team) {
    throw Object.assign(new Error('Activity user or team was not found'), { status: 404 });
  }

  return Activity.create({ user: userId, team: teamId, type, minutes, points: minutes, occurredAt: new Date() });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw Object.assign(new Error('Team input must be an object'), { status: 400 });
  }

  const { name, mascot, members } = input as Record<string, unknown>;
  if (typeof name !== 'string' || !name.trim() || typeof mascot !== 'string' || !mascot.trim()) {
    throw Object.assign(new Error('Team name and mascot are required'), { status: 400 });
  }
  if (members !== undefined && (!Array.isArray(members) || !members.every(isObjectId))) {
    throw Object.assign(new Error('Team members must be valid user IDs'), { status: 400 });
  }

  const memberIds = [...new Set((members ?? []) as string[])];
  if (memberIds.length > 0 && await User.countDocuments({ _id: { $in: memberIds } }) !== memberIds.length) {
    throw Object.assign(new Error('One or more team members were not found'), { status: 404 });
  }

  return Team.create({ name, mascot, members: memberIds });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $lookup: { from: Team.collection.name, localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $sort: { totalPoints: -1, 'team.name': 1 } },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
  ]);

  return totals.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User was not found'), { status: 404 });
  }

  const [recentActivities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean(),
    Workout.find().lean(),
  ]);
  const focusReasons = new Map<string, string>();
  const goalFocus = user.fitnessGoal.trim().toLowerCase();
  if (goalFocus) focusReasons.set(goalFocus, `Recommended for your ${user.fitnessGoal} fitness goal.`);

  for (const activity of recentActivities) {
    const activityType = activity.type.trim().toLowerCase();
    const focus = ['run', 'cycle', 'walk', 'swim', 'cardio'].includes(activityType)
      ? 'endurance'
      : ['weights', 'weightlifting'].includes(activityType)
        ? 'strength'
        : activityType;
    if (!focusReasons.has(focus)) {
      focusReasons.set(focus, `Recommended based on your recent ${activity.type} activity.`);
    }
  }

  const focusOrder = [...focusReasons.keys()];
  return workouts
    .filter((workout) => focusReasons.has(workout.focus.trim().toLowerCase()))
    .sort((left, right) => focusOrder.indexOf(left.focus.trim().toLowerCase()) - focusOrder.indexOf(right.focus.trim().toLowerCase()))
    .map((workout) => ({
      ...workout,
      reason: focusReasons.get(workout.focus.trim().toLowerCase()),
    }));
}

export { User };
