declare module 'passport-bnet' {
  import { Strategy as PassportStrategy } from 'passport';
  
  export interface BnetProfile {
    id: string;
    battletag: string;
    region?: string;
    avatar?: string;
    [key: string]: any;
  }
  
  export interface BnetStrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    region: string;
    scope: string;
  }
  
  export type VerifyCallback = (
    accessToken: string, 
    refreshToken: string, 
    profile: BnetProfile, 
    done: (error: any, user?: any) => void
  ) => void;
  
  export class Strategy extends PassportStrategy {
    constructor(options: BnetStrategyOptions, verify: VerifyCallback);
    name: string;
  }
}