# Instagram Profile Scraper MCP

## Primary Objective
Scrape profile data from https://www.instagram.com/pinkinkcosmetictattoo/ while maintaining human-like behavior to avoid detection.

## Success Metrics
1. Ability to scrape profile data from pinkinkcosmetictattoo profile
2. Store scraped data in variables for reuse with other profiles
3. Maintain Chrome session continuity with logged-in user
4. Implement human-like delays and navigation patterns

## Technical Requirements
1. Profile Data Collection:
   - Profile photo URL and download
   - Bio/description
   - Follower count
   - Following count
   - Post count
   - Profile metadata (name, username, etc.)

2. Human-like Behavior:
   - Randomized delays between actions (1-5 seconds)
   - Natural mouse movement patterns
   - Randomized scroll speeds
   - Session persistence using existing Chrome profile

3. Data Storage:
   - Save profile photos to disk
   - Store metadata in JSON format
   - Maintain data consistency with existing post data

4. Configuration:
   - Add profile-specific settings
   - Configure save locations
   - Set scraping intervals

5. Error Handling:
   - Handle rate limiting
   - Manage failed scrapes
   - Implement retry logic with exponential backoff

6. Integration:
   - Work with existing Chrome session
   - Maintain consistent data format
   - Support batch processing
   - Allow profile URL parameterization

## Implementation Notes
- Use Chrome DevTools Protocol for session continuity
- Implement random delay generator with normal distribution
- Add mouse movement simulation
- Include scroll behavior randomization
- Support multiple profile URLs through parameterization
