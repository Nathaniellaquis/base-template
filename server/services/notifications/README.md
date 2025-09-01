# Notification System Template

This notification system provides a complete infrastructure for push notifications, but requires implementation of business logic triggers.

## What's Implemented ✅

- **Push Token Management**: Store and update push tokens for iOS/Android devices
- **User Preferences**: Store notification preferences by category (updates, reminders, social)
- **Notification CRUD**: Create, read, update, delete notifications in database
- **Push Sending**: Integration with Expo Push Notification service
- **Admin Testing**: Admin panel can send test notifications
- **Frontend UI**: Notification list and overlay components

## What You Need to Implement 🚧

### 1. Notification Triggers
Add business logic to send notifications based on your app's events:

```typescript
// Example: Send reminder notification
async function sendDailyReminder(userId: string) {
  await createNotification({
    recipientId: userId,
    type: 'reminder',
    category: 'reminders',
    title: 'Daily Reminder',
    body: 'Don\'t forget to check in today!',
    data: { screen: 'home' }
  });
}
```

### 2. Scheduled Jobs
Set up cron jobs or scheduled tasks for recurring notifications:

```typescript
// Example: Daily reminder job
schedule.scheduleJob('0 9 * * *', async () => {
  const users = await getUsersWithRemindersEnabled();
  for (const user of users) {
    await sendDailyReminder(user._id);
  }
});
```

### 3. Event-Based Notifications
Hook into your app's events to send relevant notifications:

```typescript
// Example: New message notification
async function onNewMessage(message: Message) {
  await createNotification({
    recipientId: message.recipientId,
    type: 'message',
    category: 'social',
    title: 'New Message',
    body: `${message.senderName}: ${message.preview}`,
    data: { screen: 'messages', messageId: message.id }
  });
}
```

### 4. App Update Notifications
Notify users about new features or updates:

```typescript
// Example: Feature announcement
async function announceNewFeature() {
  const users = await getUsersWithUpdatesEnabled();
  for (const user of users) {
    await createNotification({
      recipientId: user._id,
      type: 'announcement',
      category: 'updates',
      title: 'New Feature Available!',
      body: 'Check out our latest feature...',
      data: { screen: 'features' }
    });
  }
}
```

## Notification Categories

The system supports three categories that users can toggle:

- **updates**: App updates, new features, announcements
- **reminders**: Daily reminders, task deadlines, scheduled events
- **social**: Messages, mentions, friend requests, social interactions

## Architecture

```
Frontend (React Native)
    ↓
Push Token Registration
    ↓
Backend Stores Token
    ↓
[YOUR BUSINESS LOGIC TRIGGERS NOTIFICATION]
    ↓
Create Notification in DB
    ↓
Send via Expo Push Service
    ↓
Device Receives Push
```

## Testing

Use the admin panel to test push notifications:
1. Go to Settings → Admin Access
2. Select "Send Test Notification"
3. Choose a user and send a test

## Security Notes

- Always check user preferences before sending notifications
- Validate push tokens before sending
- Clean up old/invalid tokens regularly
- Rate limit notification sending to prevent spam