# 📱 Play Store Deployment Guide for Campool

## Prerequisites
- Google Play Console account ($25 one-time fee)
- Android Studio installed
- Expo CLI installed
- EAS CLI installed

## Step 1: Install EAS CLI
```bash
npm install -g @expo/eas-cli
```

## Step 2: Login to Expo
```bash
eas login
```

## Step 3: Configure EAS Build
```bash
eas build:configure
```

This creates `eas.json` with build configuration.

## Step 4: Update eas.json
```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

## Step 5: Create Google Service Account

### Step 5.1: Go to Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Google Play Developer API

### Step 5.2: Create Service Account
1. Go to IAM & Admin → Service Accounts
2. Create Service Account
3. Download JSON key file
4. Save as `google-service-account.json` in project root

### Step 5.3: Link to Play Console
1. Go to Google Play Console
2. Setup → API access
3. Link service account
4. Grant necessary permissions

## Step 6: Prepare App for Production

### Step 6.1: Update API Base URL
```typescript
// In your app.json or environment variables
{
  "expo": {
    "extra": {
      "apiBaseUrl": "https://your-api-domain.com"
    }
  }
}
```

### Step 6.2: Update App Configuration
```javascript
// app.config.js
export default {
  expo: {
    name: "Campool",
    slug: "campool",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#2d6a4f"
    },
    android: {
      package: "com.yourcompany.campool",
      versionCode: 1,
      permissions: [
        "android.permission.INTERNET",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.VIBRATE",
        "android.permission.WAKE_LOCK"
      ]
    }
  }
};
```

## Step 7: Build for Production

### Step 7.1: Development Build (Testing)
```bash
eas build --platform android --profile development
```

### Step 7.2: Preview Build (Internal Testing)
```bash
eas build --platform android --profile preview
```

### Step 7.3: Production Build (Play Store)
```bash
eas build --platform android --profile production
```

## Step 8: Upload to Play Store

### Step 8.1: Manual Upload
1. Go to Google Play Console
2. Create new app
3. Upload AAB file from EAS build
4. Fill in store listing details

### Step 8.2: Automated Upload
```bash
eas submit --platform android --profile production
```

## Step 9: Store Listing Requirements

### Step 9.1: App Information
- **App Name**: Campool
- **Short Description**: Carpool app for students
- **Full Description**: 
```
Campool is a student-focused carpooling app that connects students for shared rides to university, events, and more. 

Features:
🚗 Find and share rides
💬 In-app messaging
📍 Real-time location sharing
💰 Secure payments
⭐ Rating system
🔔 Push notifications
📊 Ride tracking dashboard

Save money, reduce carbon footprint, and make new friends!
```

### Step 9.2: Graphics Required
- **App Icon**: 512x512 PNG
- **Feature Graphic**: 1024x500 PNG
- **Screenshots**: 2-8 screenshots per device type
- **Promo Video**: Optional but recommended

### Step 9.3: Content Rating
- **Category**: Transportation
- **Content Rating**: Everyone
- **Target Audience**: 18+ (University students)

## Step 10: Privacy Policy & Legal

### Step 10.1: Privacy Policy
Create privacy policy covering:
- Data collection (location, messages, payments)
- Data usage and sharing
- User rights and controls
- Contact information

### Step 10.2: Terms of Service
Create terms covering:
- User responsibilities
- Prohibited activities
- Liability limitations
- Dispute resolution

## Step 11: Testing & Quality Assurance

### Step 11.1: Internal Testing
```bash
# Create internal testing track
eas submit --platform android --track internal
```

### Step 11.2: Test Groups
1. Create test groups in Play Console
2. Add testers via email
3. Share testing link
4. Collect feedback

### Step 11.3: Beta Testing
```bash
# Create beta release
eas submit --platform android --track beta
```

## Step 12: Release Management

### Step 12.1: Staged Rollout
1. Start with 5% of users
2. Monitor crash reports
3. Gradually increase to 100%

### Step 12.2: Rollback Plan
1. Keep previous version ready
2. Monitor key metrics
3. Have rollback procedure ready

## Step 13: Post-Launch Monitoring

### Step 13.1: Key Metrics
- **Downloads**: Track daily/weekly downloads
- **Crashes**: Monitor crash-free sessions
- **Ratings**: Track user ratings and reviews
- **Retention**: Monitor user retention rates

### Step 13.2: Analytics Setup
```bash
# Install analytics
npm install @expo/analytics
```

### Step 13.3: Crash Reporting
```bash
# Install crash reporting
npm install @expo/crash-reporting
```

## Step 14: App Store Optimization (ASO)

### Step 14.1: Keywords
- Primary: carpool, rideshare, student, university
- Secondary: transportation, eco-friendly, money-saving

### Step 14.2: Description Optimization
- Use relevant keywords naturally
- Highlight unique features
- Include social proof

### Step 14.3: Screenshots Strategy
- Show key features in action
- Include user interface highlights
- Demonstrate value proposition

## Step 15: Marketing & Promotion

### Step 15.1: Pre-Launch
- Social media presence
- University partnerships
- Beta testing program
- Press releases

### Step 15.2: Launch Day
- Social media announcement
- University campus promotion
- Influencer partnerships
- App store featuring request

### Step 15.3: Post-Launch
- User feedback collection
- Feature updates
- Community building
- Referral programs

## Step 16: Maintenance & Updates

### Step 16.1: Regular Updates
```bash
# Update version in app.config.js
version: "1.0.1"
versionCode: 2

# Build and submit update
eas build --platform android --profile production
eas submit --platform android --profile production
```

### Step 16.2: Bug Fixes
- Monitor crash reports
- Fix critical bugs quickly
- Test thoroughly before release

### Step 16.3: Feature Updates
- Plan feature roadmap
- Gather user feedback
- Implement new features
- A/B test new features

## Cost Breakdown

### One-Time Costs
- **Google Play Console**: $25
- **App Icon Design**: $50-200
- **Screenshots Design**: $100-300
- **Privacy Policy**: $100-300

### Ongoing Costs
- **Google Play Console**: Free
- **EAS Build**: $29/month (or free for limited builds)
- **Analytics**: Free (Google Analytics)
- **Crash Reporting**: Free (Firebase)

### Total Estimated Cost
- **Initial Setup**: $275-825
- **Monthly**: $29 (EAS Build)

## Timeline

### Week 1-2: Preparation
- Set up accounts
- Create graphics
- Write privacy policy
- Configure EAS

### Week 3-4: Development
- Final testing
- Bug fixes
- Performance optimization
- Security review

### Week 5-6: Submission
- Build production app
- Submit to Play Store
- Address review feedback
- Prepare marketing

### Week 7-8: Launch
- App goes live
- Marketing campaign
- Monitor metrics
- Collect feedback

## Success Metrics

### Key Performance Indicators (KPIs)
- **Downloads**: Target 1000+ in first month
- **Active Users**: 70%+ monthly active users
- **Crash Rate**: <1% crash-free sessions
- **Rating**: 4.0+ stars
- **Retention**: 40%+ day-7 retention

### Growth Strategy
- **University Partnerships**: Partner with student organizations
- **Referral Program**: Incentivize user referrals
- **Social Media**: Build community presence
- **Content Marketing**: Blog about carpooling benefits

## Troubleshooting

### Common Issues
1. **Build Failures**: Check dependencies and configuration
2. **Upload Errors**: Verify service account permissions
3. **Review Rejections**: Address policy violations
4. **Performance Issues**: Optimize app size and speed

### Support Resources
- [Expo Documentation](https://docs.expo.dev/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)

## Next Steps After Launch

1. **Monitor Analytics**: Track user behavior
2. **Collect Feedback**: Use in-app feedback system
3. **Plan Updates**: Roadmap for new features
4. **Scale Infrastructure**: Prepare for growth
5. **Expand Markets**: Consider other universities

## Support & Maintenance

### User Support
- In-app help system
- FAQ section
- Contact support
- Community forums

### Technical Maintenance
- Regular updates
- Security patches
- Performance optimization
- Feature enhancements

Remember: The Play Store review process can take 1-3 days, so plan accordingly!
