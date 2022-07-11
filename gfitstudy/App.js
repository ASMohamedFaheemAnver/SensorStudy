import {GoogleSignin} from '@react-native-google-signin/google-signin';
import React, {useEffect, useState} from 'react';
import {PermissionsAndroid, Text, View} from 'react-native';
import GoogleFit, {BucketUnit, Scopes} from 'react-native-google-fit';
import {
  DEFAULT_STEPCOUNT_SOURCE,
  GOOGLE_EMAIL_SCOPE,
  WEB_CLIENT_ID,
} from './src/constants/strings';

const App = () => {
  const [totalSteps, setTotalStep] = useState(0);
  const reflectCurrentStepCount = () => {
    GoogleFit.getDailyStepCountSamples({
      bucketUnit: BucketUnit.HOUR,
    })
      .then(results => {
        console.log({
          results,
        });
        const result = results.find(
          res => res.source == DEFAULT_STEPCOUNT_SOURCE,
        );
        if (result?.steps?.[0]) setTotalStep(result.steps[0].value);
      })
      .catch(error => {
        console.log({error});
      });
  };

  useEffect(() => {
    console.log({msg: 'App.Mounted'});
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
    });
    const options = {
      scopes: [Scopes.FITNESS_ACTIVITY_READ, GOOGLE_EMAIL_SCOPE],
    };
    PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
    ).then(permissionResponse => {
      console.log({permissionResponse});
      if (permissionResponse === PermissionsAndroid.RESULTS.GRANTED) {
        GoogleFit.authorize(options)
          .then(async authRes => {
            GoogleSignin.signInSilently()
              .then(async signInResponse => {
                console.log({signInResponse});
                const tokens = await GoogleSignin.getTokens();
                console.log({tokens});
              })
              .catch(signInError => {
                console.log({signInError});
              });
            console.log({authRes});
            GoogleFit.startRecording(recordRes => {
              console.log({recordRes});
              GoogleFit.observeSteps(observeStepsResponse => {
                console.log({observeStepsResponse});
                reflectCurrentStepCount();
              });
            });
            reflectCurrentStepCount();
          })
          .catch(err => {
            console.log({err});
          });
      } else {
      }
    });

    return async () => {
      // await GoogleSignin.signOut();
      // GoogleFit.disconnect();
      console.log({msg: 'App.Unmounted'});
    };
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text
        style={{
          color: 'white',
        }}>
        {totalSteps}
      </Text>
    </View>
  );
};

export default App;
