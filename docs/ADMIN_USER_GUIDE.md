# Guttakrutt Guild Website - Admin User Guide

This comprehensive guide explains all features and functionality available in the Admin Panel of the Guttakrutt Guild Website.

## Accessing the Admin Panel

1. Navigate to `/admin` in your browser
2. Login with your admin credentials
   - Default credentials (first time only):
     - Username: `admin`
     - Password: `admin123`
   - **Important**: Change this password immediately after first login!

## Admin Panel Overview

The Admin Panel is organized into the following sections:

1. **Dashboard** - Overview of site statistics and quick actions
2. **Guild Management** - Manage guild information
3. **Raid Progress** - Manage raid progress and boss information
4. **Guild Members** - View and manage guild roster
5. **Applications** - Review and manage recruitment applications
6. **Admin Users** - Manage admin accounts
7. **Settings** - Configure website settings

## 1. Dashboard

The Dashboard provides a quick overview of:

- Total guild members count
- Recent applications
- Current raid progress
- Quick action buttons:
  - "Refresh All Data" - Updates data from Raider.IO and WarcraftLogs
  - "View Website" - Returns to the main website

## 2. Guild Management

This section allows you to manage basic guild information:

### Editing Guild Information

1. Guild Name - The name of your guild
2. Realm - The realm your guild is on
3. Region - EU/NA/etc.
4. Description - Brief information about the guild
5. Discord URL - Your guild's Discord invite link
6. Guild Logo - Upload or update the guild logo image

### Additional Information

- Founded Date - When the guild was established
- Raid Schedule - Your guild's raid times
- Social Media Links - Links to guild social media accounts

## 3. Raid Progress

This section allows you to manage raid progress information for your guild across different raids and difficulties.

### Managing Raid Progress

1. **Select Raid**:
   - Current Tier: "Liberation of Undermine"
   - Previous Tier: "Nerub'ar Palace"
   
2. **Select Difficulty**:
   - Mythic
   - Heroic
   - Normal

3. **For Each Boss**:
   - Boss Name - The name of the raid boss
   - Boss Icon - Icon from WoW (use the icon name from WoWHead)
   - Status - Toggle between "Defeated" and "Not Defeated"
   - In Progress - Toggle if the boss is currently being progressed on
   - Pull Count - Number of attempts on the boss
   - Kill Count - Number of times the boss has been defeated
   - Last Kill Date - Date of the most recent kill
   - Performance Rankings - DPS/Healing/Tank metrics
   - WarcraftLogs URL - Link to logs for the boss

### Adding New Bosses

1. Click "Add New Boss"
2. Fill in the required information:
   - Name
   - Raid Name
   - Difficulty
   - Icon URL (just use the icon name, the base URL is already configured)
   - Boss Order (determines display sequence)

### Bulk Updating

You can also use the "Update from WarcraftLogs" feature to automatically populate boss kill information if your guild has public logs.

## 4. Guild Members

This section displays all members of your guild with filtering and management options.

### Viewing Member Information

The member list shows:
- Character Name
- Class
- Specialization
- Item Level
- Role (Tank/Healer/DPS)
- Rank

### Member Management

- **Refresh Members** - Updates the member list from Raider.IO
- **Filter Options**:
  - By Class
  - By Role
  - By Rank
  - Search by name

## 5. Applications

This section allows you to manage recruitment applications submitted through the website.

### Application Management

For each application, you can:
1. **View Details**:
   - Character Information (Name, Class, Spec, Item Level)
   - Contact Information
   - Experience and Availability
   - Responses to Application Questions
   - Logs URLs
   
2. **Add Comments**:
   - Internal discussion visible only to admins
   - Each comment shows which admin posted it and when

3. **Change Status**:
   - Pending - Application is awaiting review
   - Approved - Applicant has been accepted
   - Rejected - Applicant has been declined
   - Interview - Applicant is being interviewed

4. **Add Review Notes**:
   - Detailed notes about the application
   - Visible to all admins

### Application Notifications

New applications will generate notifications for admins. These notifications can be viewed and marked as read from the admin panel.

## 6. Admin Users

This section allows you to manage admin accounts for the website.

### Admin User Management

1. **View All Admins**:
   - List of all admin accounts
   - Last login time
   
2. **Create New Admin**:
   - Username
   - Password
   - Confirm Password

3. **Edit Admin**:
   - Change Password

4. **Delete Admin**:
   - Remove admin access (except for the last remaining admin)

### Security Best Practices

- Change the default admin password immediately
- Use strong, unique passwords
- Create individual admin accounts for each person needing access
- Regularly review the admin user list and remove unnecessary accounts

## 7. Settings

This section contains various website configuration options.

### General Settings

- **Site Title** - The name displayed in the browser tab
- **Meta Description** - For SEO purposes
- **Favicon** - Site icon shown in browser tabs

### Feature Toggles

- **Enable Recruitment** - Toggle the recruitment application form
- **Enable Member List** - Toggle the public display of guild members
- **Enable Raid Progress** - Toggle the display of raid progress

### Appearance Settings

- **Theme Colors** - Customize primary and accent colors
- **Font Settings** - Change font styles
- **Hero Image** - Update the main banner image
- **Layout Options** - Adjust the website layout

## Data Refresh and API Integration

### Manual Data Refresh

The "Refresh All Data" button in the Dashboard triggers data updates from:
1. Raider.IO API - For guild and character information
2. WarcraftLogs API - For raid performance metrics

### Automatic Updates

The system is configured to automatically refresh data daily at midnight. This ensures your website always displays current information without manual intervention.

## Multi-Language Support

The admin panel supports both English and Norwegian languages:

1. Switch between languages using the language selector in the header
2. All input fields support both languages
3. Translations are applied site-wide automatically

## Troubleshooting Common Issues

### API Connection Issues

If data isn't updating correctly:
1. Check your API credentials in the Settings
2. Verify your guild name and realm are spelled correctly
3. Ensure your WarcraftLogs reports are public if using that integration

### Database Issues

If you encounter database errors:
1. Check your database connection in the server settings
2. Verify the database schema is up-to-date
3. Ensure you have appropriate permissions

### Admin Access Problems

If you can't access the admin panel:
1. Clear your browser cache and cookies
2. Try using an incognito/private browser window
3. If you've forgotten your password, see the README for reset instructions

## Best Practices

1. **Regular Backups** - Regularly back up your database
2. **Keep Updated** - Ensure your server and dependencies are updated
3. **Security** - Use strong passwords and limit admin access
4. **Content Management** - Regularly update raid progress and guild information
5. **Application Review** - Check for new applications regularly