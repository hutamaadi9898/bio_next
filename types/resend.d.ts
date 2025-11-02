declare module "resend" {
  export class Resend {
    constructor(apiKey?: string);
    emails: {
      send(options: any, params?: any): Promise<any>;
    };
  }
}

