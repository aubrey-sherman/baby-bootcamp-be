type tUser = {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  babyName: string;
}

type tFeedingEntryParams = {
  volumeInOunces: number;
  eliminating: boolean;
  feedingTime: Date;
  username: string;
}

export { tUser, tFeedingEntryParams };