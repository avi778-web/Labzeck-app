# Labzeck — Complete Product Design & Layout Specification

## 1. Product direction

Labzeck is a trustworthy, high-tech labour marketplace connecting Labour users with Hirers. The product should feel fast, safe, local, and professional rather than playful or overly decorative.

**Primary goals**
- Help Hirers discover reliable Labour users quickly.
- Help Labour users present a clear, credible profile.
- Make chat, hiring, and profile actions obvious on small phones.
- Keep authentication, profile ownership, and photo permissions secure.

## 2. Visual system

### Color tokens
| Token | Value | Use |
|---|---|---|
| Navy | `#132344` | Headings, important text |
| Primary blue | `#1761E8` | Buttons, active navigation, links |
| Blue tint | `#F5F9FF` | Search fields, selected cards, empty states |
| Border | `#E2EAF4` | Card borders and dividers |
| Muted text | `#718198` | Supporting text and metadata |
| Success green | `#2E9B59` | Available, verified, active states |
| Rating gold | `#D79018` | Ratings and reviews |
| White | `#FFFFFF` | Cards and main surfaces |

Use no more than these colors at a time. Maintain accessible contrast for text and controls.

### Typography
- Use one clean sans-serif family for the application.
- Headings: dark navy, weight 700–800, tight letter spacing.
- Body: 13–15px, line-height 1.45–1.6.
- Metadata: 11–13px, muted text.
- Buttons: 13–14px, weight 700.
- Do not use all-caps for long content.

### Shape and elevation
- App cards: 16–20px radius.
- Inputs: 14–16px radius.
- Avatar: perfect circle when showing initials or a photo.
- Primary buttons: 12–14px radius.
- Use subtle shadows only: `0 6px 20px rgba(32, 70, 120, .08)`.
- Use 8px spacing increments: 8, 12, 16, 20, 24, 32.

## 3. App shell

### Desktop
- Center the product in a responsive mobile-style shell for the marketplace experience.
- Maximum content width: 470px for phone-first screens.
- On wider layouts, use a two-column dashboard only where the feature benefits from it.
- Keep the bottom navigation aligned to the app shell, not the browser viewport edge.

### Mobile
- Support 300px to 430px widths.
- Add safe-area padding at the bottom.
- Prevent horizontal overflow.
- Keep fixed footer content above the safe area.
- Ensure touch targets are at least 44px.
- Never allow a long name, role, or payment value to push an icon off-screen.

## 4. Global header

Header layout:
1. Labzeck mark on the left.
2. Brand name: `Labzeck`.
3. Subtitle: `Work made simple`.
4. Current user initials avatar on the right.

For inner screens, replace the brand header with:
- 44px back button.
- Screen title.
- Optional right-side action.

The back button must return to the previous app screen without clearing authentication or navigation state.

## 5. Bottom navigation

Items, in order:
1. Home
2. Chat
3. AI
4. Profile

Rules:
- Only the current route is blue and raised.
- The clicked item must open the matching screen.
- Never highlight AI when Profile or Chat is open.
- Fixed bottom position, centered in the app shell.
- Use icon above label.
- Active icon may translate upward by 6–10px.
- Add a subtle active color, not a large pill that hides content.

## 6. Authentication and onboarding

### Sign-up
Fields:
- Full name.
- Email.
- Password, minimum 8 characters.
- Privacy/terms confirmation.

Show a short instruction panel: `Create your free Labzeck account in 3 steps.`

Errors:
- Duplicate email: `This email already has an account. Switch to Sign in.`
- Invalid password: explain the 8-character requirement.
- Generic failure: do not reveal provider or database details.

### Role selection
After successful sign-up, show two clear cards:
- Labour: `Find work and show your skills.`
- Hirer: `Find trusted help for your work.`

Persist the role server-side. Do not rely on localStorage for identity or authorization.

## 7. Home screen

### Layout order
1. Header and current location.
2. Search input with search icon and keyboard shortcut hint.
3. Quick categories.
4. Nearby Labour/job cards.
5. Active offers or recommended work.
6. Empty state if there are no matches.

### Worker card
Each card includes:
- Round avatar.
- Full name.
- Availability status.
- Occupation.
- Daily/hourly payment.
- Location.
- Right-arrow action.

Keep the card readable at 300px width. Use ellipsis only for secondary text, never for the main name.

## 8. Avatar and initials system

### No-photo fallback
When no photo exists, always show:
- First letter of the first name.
- First letter of the surname.

Examples:
- Riya Sharma → `RS`
- Arjun Kumar → `AK`
- Sara Khan → `SK`

Render initials as direct text inside a centered circular avatar. Do not put nested availability, role, or helper text inside the avatar. The avatar must have:
- `display: flex`.
- `align-items: center`.
- `justify-content: center`.
- `overflow: hidden`.
- White, bold text.
- Blue gradient background.

Use the same helper function across Home, Chat, Profile, and Header. Never hardcode initials for a particular user.

## 9. Chat screen

### Chat list layout
1. Header: back button and `Chats` title.
2. Search chats input.
3. Message rows.
4. Security helper text: `Secure conversations for work offers`.
5. Bottom navigation.

Each row contains:
- Round initials/photo avatar.
- User name.
- Green availability status.
- Role/occupation.
- Rate and location.
- Right arrow.

### Interactions
- Tapping the avatar or user name opens the public profile.
- Tapping the chat row/action opens the conversation.
- Keep profile navigation separate from conversation navigation.
- Do not show edit controls on another user’s public profile.

## 10. Public profile screen

### Layout order
1. Back button and `Public profile` title.
2. Large centered photo or initials avatar.
3. Full name and occupation.
4. Verified badge.
5. Availability pill.
6. Rating and review count.
7. Skill chips.
8. Three insight cards: rate, start time, location.
9. About section.
10. Fixed or bottom action row: Chat and Hire.

### Profile content
Example:
- `Riya Sharma`
- `Home helper · Jaipur`
- `Verified`
- `Available today`
- `4.9 · 128 reviews`
- Skills: `House cleaning`, `Cooking`, `Child care`
- Rate: `₹800 / day`
- Experience: `4 years`
- Languages: `Hindi, English`

Do not overfill the screen. Use clear grouping and generous whitespace.

## 11. Photo ownership and editing

Only the authenticated Labour owner can change their own photo.

Rules:
- Public viewer: photo/profile is view-only.
- Hirer: can view Labour photo but cannot change it.
- Labour owner: can upload, replace, or remove their own photo from their authenticated Profile/Edit Profile screen.
- Never display `Add photo` or `Edit photo` on another user’s public profile.
- Enforce ownership on the server with `session.user.id === profile.ownerId` and role `Labour`.
- UI hiding is not sufficient authorization.
- If no photo exists, show dynamic initials.

## 12. AI screen

Include:
- Clear heading.
- Short explanation of what the assistant can do.
- Prompt suggestion chips.
- Composer with accessible label.
- Loading state.
- Error state.
- Conversation history.

Keep AI requests server-side and use Vercel AI Gateway. Never expose provider keys in client code.

## 13. MongoDB data model

Collections:
- `user`
- `session`
- `account`
- `verification`
- `profiles`
- `offers`
- `chats`
- `messages`
- `locations`
- `subscriptions`
- `referrals`
- `emergencyPosts`

Profile fields:
- `ownerId`
- `role`
- `name`
- `photoUrl`
- `occupation`
- `skills`
- `availability`
- `location`
- `rate`
- `experience`
- `languages`
- `about`
- `rating`
- `reviewCount`
- `createdAt`
- `updatedAt`

Add indexes for `ownerId`, `role`, `location`, `availability`, and chat participant IDs.

## 14. Security and quality

- Use Better Auth sessions and secure preview cookies.
- Protect every profile mutation on the server.
- Validate and sanitize all request bodies.
- Scope user-owned reads/writes by authenticated user ID.
- Use safe generic auth errors in the UI.
- Add baseline headers: `nosniff`, strict referrer policy, HSTS, and appropriate permissions policy.
- Do not use mock auth or client-only persistence.
- Do not use emoji as interface icons.
- Add alt text to profile photos.
- Add visible focus states.
- Respect reduced-motion preferences.

## 15. Acceptance checklist

- [ ] Sign-up succeeds with email/password.
- [ ] Sign-in persists through a full reload.
- [ ] Sign-out clears the session.
- [ ] Role selection persists in MongoDB.
- [ ] Home cards show correct dynamic initials.
- [ ] Riya Sharma renders `RS` when no photo exists.
- [ ] Arjun Kumar renders `AK` when no photo exists.
- [ ] No `Available` or role text appears inside an avatar.
- [ ] Chat name/avatar opens public profile.
- [ ] Chat action opens conversation.
- [ ] Profile navigation highlights only Profile.
- [ ] Labour owner can change only their own photo.
- [ ] Hirer/public viewer cannot change another user’s photo.
- [ ] Public profile is view-only for non-owners.
- [ ] Layout works at 300×600 and 430×932.
- [ ] No horizontal scroll or clipped content.
- [ ] Production build passes.
- [ ] MongoDB persistence survives reload.

## 16. Implementation principle

Build the smallest clear interaction first, then add visual polish without weakening ownership, accessibility, mobile readability, or server-side authorization. Every visual control must map to a real authenticated action, and every user-owned action must be checked on the server.
