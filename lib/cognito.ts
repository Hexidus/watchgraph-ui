import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-2_4qSZVI2WH',
      userPoolClientId: '223nnbea9edf3tach13ilck1mq',
    },
  },
});