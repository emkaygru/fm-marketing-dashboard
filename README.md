# Female Mavericks Marketing Dashboard

A comprehensive marketing dashboard for planning, tracking, and analyzing content across multiple platforms.

## Features

### Content Planning & Management
- **Social Calendar** - Weekly content planning for Instagram, Facebook, and LinkedIn
  - 4-week table view with navigation
  - Monthly calendar grid view
  - Status tracking workflow (draft → paused → ready_for_approval → needs_edits → approved → scheduled → posted)
  - Inline comments and approval workflow
  - Duplicate content feature for quick reuse

- **Blog Posts** - Track Female Mavericks blog content
  - Wednesday publication schedule
  - Author assignments (Beth Mazza, Victoria Sivrais)
  - Status tracking (draft, in_progress, published)

- **Beth's LinkedIn** - Dedicated view for LinkedIn content
  - Filtered view for Beth's assignments
  - 4-week navigation
  - "Mark as Created" workflow

- **Content Dashboard** - Weekly overview tracker
  - Content flow visualization (blog → LinkedIn → social media)
  - Week-by-week status indicators

### Analytics
- **Google Analytics 4** - Metrics from 3 properties (Main, Funnel, Checkout)
- **Instagram Insights** - Reach, engagement, follower growth
- **Facebook Page Analytics** - Page views, engagement, followers
- **GoHighLevel Newsletter** - Subscriber metrics and campaign tracking
- **Google Search Console** - Search impressions, clicks, CTR

## Tech Stack

- **Next.js 14** - App Router with TypeScript
- **Vercel Postgres** - Database with @vercel/postgres
- **Tailwind CSS** - Styling with custom Female Mavericks brand colors
- **date-fns** - Date manipulation
- **Recharts** - Data visualization
- **Lucide React** - Icons

## Setup Instructions

### 1. Clone the Repository

```bash
git clone [repository-url]
cd fm-marketing-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required variables:
- **Database**: Vercel Postgres connection strings
- **GA4**: Google Analytics 4 property IDs and service account credentials
- **Meta/Facebook**: Access token, Page ID, Instagram Business Account ID
- **GoHighLevel**: API key and Location ID
- **Search Console**: Property URL and service account credentials

### 4. Initialize Database

Run the database initialization endpoint to create tables:

```bash
# Start dev server
npm run dev

# Visit in browser or use curl
curl -X POST http://localhost:3000/api/init-db
```

This creates the following tables:
- `social_content` - Social media posts
- `content_comments` - Comment threads
- `blog_posts` - Blog post tracking
- `content_tracker` - Weekly content overview
- `campaigns` - Campaign tracking (for analytics)

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Database Schema

### social_content
- `id` - Primary key
- `post_date` - Scheduled post date
- `week_of` - Monday of the week (auto-calculated)
- `content_type` - Post, Reel, or Story
- `platform` - Instagram, Facebook, or LinkedIn
- `content_needs` - Description/topic
- `asset_link` - Canva or Google Drive link
- `caption` - Post caption
- `status` - Workflow status
- `assigned_to` - Team member (Ali, Beth, etc.)
- `created_by` - Creator name
- `created_at`, `updated_at` - Timestamps

### content_comments
- `id` - Primary key
- `content_id` - References social_content
- `author_name` - Emily, Victoria, Ali
- `comment_text` - Comment content
- `resolved` - Boolean flag
- `parent_comment_id` - For threaded replies
- `created_at`, `updated_at` - Timestamps

### blog_posts
- `id` - Primary key
- `title` - Blog post title
- `topic` - Subject matter
- `author` - Beth Mazza or Victoria Sivrais
- `publish_date` - Wednesday publication date
- `link` - Published URL
- `status` - draft, in_progress, published
- `created_at`, `updated_at` - Timestamps

### content_tracker
- `id` - Primary key
- `week_of` - Monday of the week (unique)
- `blog_post_id` - References blog_posts
- `blog_post_link` - Published blog URL
- `beth_linkedin_status` - planned, created, posted
- `social_media_status` - planned, created, posted
- `created_at`, `updated_at` - Timestamps

## Status Workflow

Content follows this approval workflow:

1. **draft** - Initial creation
2. **paused** - On hold
3. **ready_for_approval** - Ready for review
4. **needs_edits** - Requires changes
5. **approved** - Approved for scheduling
6. **scheduled** - Scheduled in platform
7. **posted** - Published live

## Color Coding

- Draft: Gray
- Paused: Yellow
- Ready for Approval: Blue
- Needs Edits: Orange
- Approved: Green
- Scheduled: Purple
- Posted: Emerald

## API Routes

### Social Content
- `GET /api/social-content?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&platform=Platform`
- `POST /api/social-content` - Create content
- `PUT /api/social-content` - Update content
- `DELETE /api/social-content` - Delete content

### Comments
- `GET /api/social-content/comments?content_id=ID`
- `POST /api/social-content/comments` - Add comment
- `PUT /api/social-content/comments` - Update/resolve comment
- `DELETE /api/social-content/comments` - Delete comment

### Blog Posts
- `GET /api/blog-posts?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- `POST /api/blog-posts` - Create post
- `PUT /api/blog-posts` - Update post
- `DELETE /api/blog-posts` - Delete post

### Content Tracker
- `GET /api/content-tracker?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- `POST /api/content-tracker` - Create tracker entry
- `PUT /api/content-tracker` - Update tracker

### Analytics
- `GET /api/ga4?range=7d|30d|90d&property=main|funnel|checkout`
- `GET /api/instagram?range=7d|30d|90d`
- `GET /api/facebook?range=7d|30d|90d`
- `GET /api/ghl?range=7d|30d|90d`
- `GET /api/search-console?range=7d|30d|90d`

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Database Setup

The database is shared with the existing `fm-analytics-updated` project. New tables are added to the existing Neon Postgres instance.

## User Roles

- **Emily** - Admin, content approval
- **Ali** - Content creator
- **Victoria** - Final approver, comments only
- **Beth** - LinkedIn content creator

## Future Enhancements

- Email notifications (Resend API integration)
- Password/token-based access control
- Zapier webhook integration for status changes
- Export content calendar to CSV/Google Sheets
- Mobile app companion

## Brand Colors

Female Mavericks color palette (defined in `tailwind.config.ts`):
- Navy: #1a365d
- Blue: #2563eb
- Orange: #ff6b35
- Yellow: #fbbf24

## Support

For issues or questions, contact the development team.
