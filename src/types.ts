type tUser = {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
}

type tFeedingEntryParams = {
  volumeInOunces: number;
  eliminating: boolean;
  feeding_time: Date;
  username: string;
}

export { tUser, tFeedingEntryParams };