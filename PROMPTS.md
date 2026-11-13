# WelcomeHome SG — Collated Session Prompts

This file collates the chronological user prompts from this build session for **WelcomeHome SG**.

> **Notes:**
> - Any GitHub Personal Access Token (`ghp_...`) pasted in chat has been redacted as `<REDACTED_GITHUB_PAT>` for security.
> - Prompt 1 was partially truncated during an earlier conversation compaction (`2,539 bytes` omitted at the end of section `C. Technical Architecture`); all available text is preserved verbatim below without fabrication.

---

## Prompt 1 — Initial AI-Powered Property Platform Brief
*Attachment:* `WelcomeHome.jpg` (`/public/assets/aistudio/WelcomeHome_c609a9b7.jpg` — Business Plan canvas)

```markdown
# AI Studio Prompt: AI-Powered Property Platform

## 1. ROLE
Act as a senior full-stack software engineer, AI solutions architect, UI/UX designer, and PropTech product strategist with expertise in building scalable property technology platforms.

You have experience developing property marketplaces, AI chatbots, property valuation tools, rental management systems, and real estate transaction platforms.

## 2. GOAL
Design and build a modern, AI-powered, one-stop property platform that simplifies buying, selling, renting, managing, and investing in real estate.

The platform should reduce dependence on traditional property agents by providing intelligent, automated, transparent, and user-friendly property services.

The application should be suitable for an MVP, with the potential to scale into a commercial SaaS platform.

## 3. CONTEXT

The business idea is based on a one-stop property platform serving the Singapore real estate market.

**Target Customers:**
- Property owners and landlords
- Home buyers and sellers
- Tenants and renters
- Undergraduate students seeking accommodation
- Expatriate families
- Property investors
- Companies seeking property-related services

**Core Features:**

1. AI-powered property chatbot to answer questions and guide users.
2. Property listing and search functionality.
3. Property price comparison and valuation estimates.
4. AI-assisted virtual home viewing.
5. Rental management and maintenance request tracking.
6. Property ownership insights and downloadable reports.
7. Affordability and financing calculators.
8. Automated property viewing and communication.
9. End-to-end transaction support.
10. Personalised property transaction tracker.

**Business Model:**
- Freemium access
- Bronze, Silver, and Gold subscription tiers
- Advertising revenue
- Referral partnerships
- Premium property reports and insights

**Technology Considerations:**
- Responsive web application
- Secure user authentication
- Property database
- AI chatbot integration
- Integration-ready architecture for relevant Singapore property data APIs
- Scalable backend infrastructure

## 4. OUTPUT

Generate a functional MVP web application with the following deliverables:

**A. User Interface**
- Professional, modern real estate dashboard
- Mobile-responsive design
- Property search with filters
- Property listing cards with images
- AI chatbot interface
- User profile and account dashboard

**B. Functional Modules**
- Property listing management
- Property search and filtering
- Property price comparison
- Affordability calculator
- Viewing appointment scheduler
- Maintenance request submission
- Subscription plan selection
- Property transaction progress tracker

**C. Technical Architec[... truncated 2,539 bytes during earlier context compaction ...]
```

---

## Prompt 2 — Push Initial MVP to GitHub

```text
git push https://<REDACTED_GITHUB_PAT>@https://github.com/annytan3321-arch/WelcomeHome.git
```

---

## Prompt 3 — Add Live data.gov.sg Collection 189 Connection

```text
add a serverless connection that pulls live data from data.gov.sg for resale flat prices using the following endpoint: import requests
          
collection_id = 189          
url = "https://api-production.data.gov.sg/v2/public/api/collections/{}/metadata".format(collection_id)
        
response = requests.get(url)
print(response.json())
```

---

## Prompt 4 — Fix Dev Server Startup

```text
The dev server didn't start, please fix it
```

---

## Prompt 5 — Full Serverless Backend Integration for Vercel & GitHub (`/api/health.ts` & `/api/datagsg.ts`)

```markdown
Build a serverless backend API integration for my new website using Singapore's data.gov.sg OpenAPI.

**1. API endpoint**

https://api-production.data.gov.sg/v2/public/api/collections/189/metadata

Collection ID: 189

Use this endpoint to retrieve collection metadata. Identify the available datasets and implement the appropriate API requests to retrieve the actual data required by my website.

**2. Backend folder structure**

Store the backend serverless functions in the `/api` folder at the project root level, NOT inside the `/src` folder.

Use a structure compatible with Vercel serverless functions.

**3. Create these API files**

- `/api/health.ts` — check backend availability and configuration.
- `/api/datagsg.ts` — retrieve and process data from data.gov.sg.

Use TypeScript if compatible with my existing project.

**4. API keys and security**

- Do not hardcode any API keys, tokens or secrets.
- I will input any required API keys later.
- Use environment variables for credentials where necessary.
- Do not expose API keys in frontend code.
- Do not require an API key if the endpoint supports public access.

**5. Data retrieval**

- Connect to the actual data.gov.sg API.
- Retrieve the available collection metadata.
- Identify the correct dataset IDs and data endpoints.
- Fetch actual dataset records where supported.
- Handle pagination where required.
- Add caching to reduce unnecessary requests.
- Handle errors, timeouts and unavailable responses.
- Do not generate fake or simulated data.

**6. Frontend integration**

Connect the new backend API to my website.

- Display the retrieved information using my existing website design.
- Include loading and error states.
- Ensure the website works on desktop and mobile.
- Preserve existing features.

**7. GitHub and Vercel**

- Ensure the code is compatible with GitHub and Vercel.
- Use Vercel-compatible serverless API routes.
- Do not place backend files inside `/src`.
- Do not hardcode secrets.
- Ensure production builds work correctly.

**8. Testing and verification**

After implementation:

1. Show all files created or modified.
2. Verify the API response and data structure.
3. Confirm that the frontend retrieves data from the backend.
4. Identify any required environment variables.
5. Explain how to deploy the project through GitHub and Vercel.
6. Preserve all existing website functionality.

Important: This is a NEW website. Do not add LTA DataMall, carpark availability APIs or unrelated integrations. Only integrate data.gov.sg Collection 189.
```

---

## Prompt 6 — Confirm Vercel Serverless Route Structure & Live Frontend Connection

```text
Use the following data.gov.sg API endpoint:

https://api-production.data.gov.sg/v2/public/api/collections/189/metadata

Collection ID: 189

1. Integrate this API into my new website. Retrieve the collection metadata, identify the relevant dataset IDs, and use the appropriate data.gov.sg API endpoints to fetch actual dataset records where available.

2. Store the serverless backend code in the `/api` folder at the project root level (not inside the `/src` folder).

3. Include `/api/health.ts` and `/api/datagsg.ts` within the same `/api` folder.

4. Do not hardcode any API keys or secrets. I will input them later if required. Use environment variables for any credentials.

5. Ensure both API routes are compatible with Vercel serverless functions and work after deployment through GitHub and Vercel.

6. Connect the frontend to `/api/datagsg.ts` through the `/api/datagsg` URL route. Use actual API responses, not simulated data.

7. Do not change or remove existing website functionality.
```

---

## Prompt 7 — Push Serverless Integration to GitHub

```text
git push https://<REDACTED_GITHUB_PAT>@https://github.com/annytan3321-arch/WelcomeHome.git
```

---

## Prompt 8 — Switch All Live Features to `/api/datagsg`, Remove Simulated Property Data & Push

```text
My Vercel backend /api/datagsg is now successfully returning HDB resale transaction data from data.gov.sg Collection 189.

Please verify that my website's HDB resale search, property listings, price comparisons and analytics use the actual records returned by /api/datagsg.

Remove any simulated or hardcoded property data from live-data features. Preserve the existing design and functionality.

Handle loading, errors and empty results correctly.

Do not change the working backend API unnecessarily.

After verification, commit and push any required changes to GitHub so Vercel can redeploy automatically.
```

---

## Prompt 9 — Collate All Prompts

```text
collate all of the prompts and store them as a PROMPTS.md file!
```
