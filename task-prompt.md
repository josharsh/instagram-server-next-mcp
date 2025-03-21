# Task Execution Guidelines


Proceed with the next task from tasks.md


Work on only 1 task at a time until that task is completed. Choose a task that [ ] has yet to be marked as completed and proceed.


The task can only be completed after you've tested the functionality of the task and achieved the intended result. Run the file using `npx tsx filepath`, use the naming structure `test_filename.ts` for any files created to test the functionality. I do not want to use vitest, jest or any mock tests, the 'test file' must run the code and verify the output is the desired result using production environment settings.


There can be NO WARNING or ERROR PROBLEMS in the IDE:
```
Example:
[{
   "resource": "/Users/ryan/CursorCode/invoice_manager/invoice_manager/src/lib/status/statusService.ts",
   "owner": "typescript",
   "code": "2339",
   "severity": 8,
   "message": "Property 'comparisonStatus' does not exist on type 'PrismaClient<PrismaClientOptions, never, DefaultArgs>'.",
   "source": "ts",
   "startLineNumber": 22,
   "startColumn": 19,
   "endLineNumber": 22,
   "endColumn": 35
}]
```


On completion, edit tasks.md, mark the task as completed [x] and provide the method used to verify functionality along with the intended result.


## Example Task Completion Format


```markdown
- [x] Add JSON/CSV export
  - File: src/lib/pdfProcessor.ts
  - Tested by:
    - Running the CSV export function with sample invoice data
    - Verifying output matches ParsedInvoice type structure
    - Executed test command:
      ```bash
      npx tsx src/lib/comparison/reports/test_reportService.ts
      ```
    - Verified CSV output format:
      ```csv
      Invoice Number,Invoice Date,Customer Name,Customer Number,Status,Matched Transaction ID,Amount,Currency
      INV001,1736378546030,Test Customer,CUST001,matched,TXN001,100,
      INV002,1736378546030,Test Customer 2,CUST002,unmatched,N/A,200,
      ```
    - Confirmed:
      - Correct headers are present
      - Data types match expected format
      - Currency formatting is consistent
      - Status values are accurate
```


# Instagram Profile Scraper MCP


## Primary Objective
Scrape profile data from https://www.instagram.com/pinkinkcosmetictattoo/ while maintaining human-like behavior to avoid detection.


## Success Metrics
1. Ability to scrape profile data from pinkinkcosmetictattoo profile
2. Store scraped data in variables for reuse with other profiles  
3. Maintain Chrome session continuity with logged-in user
4. Implement human-like delays and navigation patterns


## Technical Requirements


### 1. Profile Data Collection
- Profile photo URL and download
- Bio/description
- Follower count
- Following count
- Post count
- Profile metadata (name, username, etc.)


### 2. Human-like Behavior
- Randomized delays between actions (1-5 seconds)
- Natural mouse movement patterns
- Randomized scroll speeds
- Session persistence using existing Chrome profile


### 3. Data Storage
- Save profile photos to disk
- Store metadata in JSON format
- Maintain data consistency with existing post data


### 4. Configuration
- Add profile-specific settings
- Configure save locations
- Set scraping intervals


### 5. Error Handling
- Handle rate limiting
- Manage failed scrapes
- Implement retry logic with exponential backoff


### 6. Integration
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



