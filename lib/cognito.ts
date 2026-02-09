import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-2_4qSZVI2WH',
      userPoolClientId: '2slkvm14n3qbg7ele6i0fkfjos',
    },
  },
});