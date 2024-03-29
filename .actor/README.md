
SKCRIS Scraper
===============================

Extract Slovak research organisations, projects, employees, and data on their equipment, services, outputs, and more.

## What is SKCRIS Scraper and how it works?

[SK CRIS](https://www.skcris.sk/portal/) - Slovak Current research information system
([What is CRIS?](https://en.wikipedia.org/wiki/Current_research_information_system)) - Is the authoritative database
on research in Slovakia.

The database contains contact info, outputs, services,
and project participation of organisations and researchers registered in Slovakia.
If an organisation or a researcher received public funding for their research, you can
find them here.

IMPORTANT: As of Aug 2023, you need to have a Slovak proxy!

With SKCRIS Scraper, you can extract:

- [All organisations in SKCRIS]( https://www.skcris.sk/portal/web/guest/register-organizations )
- [All researchers in SKCRIS]( https://www.skcris.sk/portal/web/guest/register-researchers )
- [All projects in SKCRIS]( https://www.skcris.sk/portal/web/guest/register-projects )

For each of the above, you can:

- Filter down by geographic region (kraj), or by starting letter
- Select whether to include all related resources (e.g. org's employees, projects, equipment, ...)

See the [outputs section](#outputs) for a detailed description.

The data can be downloaded in JSON, JSONL, XML, CSV, Excel, or HTML formats.



## Features



This actor is a robust production-grade solution suitable for businesses and those that need reliability.

- **Blazing fast**
  
  - The actor doesn't use a browser, which means it's fast and cheap.
  - High throughput - browser paginates at 10 entries per page. This scraper goes at 500 entries per page
      (~ 13x speed performance improvement).
- **3 kinds of datasets**
  
  - Scrape details of organisations, researchers or projects.

- **Fast or Detailed modes**
  
  - Scraping can be fast (only data on the entries themselves) or detailed (includes all relationships).

- **Filter support**
  
  - Filter the results by geographic region (kraj) or starting letter.
  - Limit the number of results.


- **Proxy support**
  
  - You can use Apify's proxy, or your own, via Input.

- **Integrated data filtering and transformation**
  
  - Filter and modify scraped entries out of the box from within Apify UI, without needing other tools.

- **Integrated cache**
  
  - You can use cache together with custom filtering to e.g. save only NEW entries to the dataset. Save time and reduce cost.
  - Cache automatically stores which entries were already scraped. Cache can persist between different scraper runs.

- **Custom crawler configuration**
  
  - For advanced needs, you can pass Crawler configuration via Input.

- **Tested daily for high reliability**
  
  - The actor is regularly tested end-to-end to minimize the risk of a broken integration.

- **Privacy-compliant (GDPR)**
  
  - By default, personal data is redacted to avoid privacy issues. You can opt-in to include un-censored data.

- **Pass scraped dataset to other actors**
  
  - Automatically trigger another actor when this one is done to process the scraped dataset.
  - Metamorphing means that the dataset and key-value store is passed to another actor.
  - Actor metamorph can be configure via actor input. No need to define custom actors just for that.

- **Error monitoring**
  
  - Errors from your runs are captured and surfaced in the `REPORTING` dataset. (See Storage > Dataset > Select dropdown).
  - Errors are also automatically reported to [Sentry](https://sentry.io/).





## How can you use the data scraped from SKCRIS? (Examples)


Lead gen:

- Find potential partners or clients for your service or product.

Research:

- Find organisations and researchers related to your research topic of interest.
- Find organisations with the equipment you need.
- Find mentors, potential employers or employees

Analysis:

- Find the most active researchers by field, region, or overall.
- Understand research and funding trends over time.

## How to use SKCRIS Scraper



1. Create a free Apify account using your email
2. Open SKCRIS Scraper
3. In Input, select the dataset to scrape, and filters to apply.
4. Click "Start" and wait for the data to be extracted.
5. Download your data in JSON, JSONL, XML, CSV, Excel, or HTML format.

For details and examples for all input fields, please visit the [Input tab](https://apify.com/jurooravec/skcris-scraper/input-schema).



## How much does it cost to scrape SKCRIS?



### Organisations

<table>
  <thead>
    <tr>
      <td></td>
            <td><strong>
        100 results
      </strong></td>
            <td><strong>
        Full run (~ 2.6K results)
      </strong></td>
          </tr>
  </thead>

  <tbody>
        <tr>
      <td>
        Fast run
      </td>
            <td>
        $0.014 in  2m 0s
      </td>
            <td>
        $0.289 in  42m 0s
      </td>
          </tr>
        <tr>
      <td>
        Detailed run
      </td>
            <td>
        $0.08 in  11m 37s
      </td>
            <td>
        $2.008 in 4h 52m 
      </td>
          </tr>
      </tbody>
</table>

### Researchers

<table>
  <thead>
    <tr>
      <td></td>
            <td><strong>
        100 results
      </strong></td>
            <td><strong>
        Full run (~ 37.5K results)
      </strong></td>
          </tr>
  </thead>

  <tbody>
        <tr>
      <td>
        Fast run
      </td>
            <td>
        $0.016 in  2m 23s
      </td>
            <td>
        $3.567 in 8h 39m 
      </td>
          </tr>
        <tr>
      <td>
        Detailed run
      </td>
            <td>
        $0.052 in  7m 30s
      </td>
            <td>
        $16.949 in 41h 5m 
      </td>
          </tr>
      </tbody>
</table>

### Projects

<table>
  <thead>
    <tr>
      <td></td>
            <td><strong>
        100 results
      </strong></td>
            <td><strong>
        Full run (~ 24.9K results)
      </strong></td>
          </tr>
  </thead>

  <tbody>
        <tr>
      <td>
        Fast run
      </td>
            <td>
        $0.017 in  2m 30s
      </td>
            <td>
        $4.288 in 6h 14m 
      </td>
          </tr>
        <tr>
      <td>
        Detailed run
      </td>
            <td>
        $0.066 in  9m 40s
      </td>
            <td>
        $16.548 in 4h 7m 
      </td>
          </tr>
      </tbody>
</table>


<br/>


### Whole database

- Fast run - $8.14 over 10-20h
- Detailed run - $35.51 over 42-90h

NOTE: Prices are only indicative, based on runs of 200 entries.

Remember that with the [Apify Free plan](https://apify.com/pricing), you have $5 free usage per month.


### Comments on performance

The speed of scraping depends on:

1. Detailed vs fast mode:
    - In fast mode, we only request the HTML (web page). This is much faster.
    - In detailed mode, we make 10-20+ more requests against the server, and
    the server has to look up items in the database for each request. Hence it's slower.

2. Server load
    - If there is no load on the server, we can do more requests to get the results faster.
    - But if there is already considerable load (e.g. someone else is scraping too),
    then expect a slower response.

> **To ensure you get the data, you should configure the crawler settings to minimize timeout errors**

Recommended settings:

- **maxConcurrency** - Up to 8. However, if you keep getting timeour errors, the server
  might be under heavier load, in which case set maxConcurrency to 3.
- **Memory (RAM)** - 512 MB (there's no point in going higher), or 256 MB if maxConcurrency is set to 3.
- **Timeout** - No timeout.

## Input options



For details and examples for all input fields, please visit the [Input tab](https://apify.com/jurooravec/skcris-scraper/input-schema).



### Filter options



You can run SKCRIS Scraper as is, with the default options, to get a sample of the 
organisations entries (fast mode).

Otherwise, you can filter by:

  - Geographic region (kraj)
  - Starting letter



### Limit options



To limit how many results you get, set `outputMaxEntries` to desired amount.



### Input examples




#### Example 1: Get the first 200 organisations (fast mode)

```json
{
  "datasetType": "organisations",
  // Omit relationships to other entries
  "entryIncludeLinkedResources": false,
  "outputMaxEntries": 200,
  "listingItemsPerPage": 200,
}
```


#### Example 2: Same as above, but specified by providing a start URL

```json
{
  "startUrls": [
    "https://www.skcris.sk/portal/web/guest/register-organizations"
  ],
  // Omit relationships to other entries
  "entryIncludeLinkedResources": false,
  "outputMaxEntries": 200,
  "listingItemsPerPage": 200,
}
```


#### Example 3: Get all researchers (detailed mode)

```json
{
  "datasetType": "researchers",
  // Include relationships to other entries
  "entryIncludeLinkedResources": true,
}
```


#### Example 4: (Advanced) Same as above, but re-configure the crawler to increase concurrency

```json
{
  "datasetType": "researchers",
  // Include relationships to other entries
  "entryIncludeLinkedResources": true,
  "maxConcurrency": 8,
}
```





## Outputs



Once the actor is done, you can see the overview of results in the Output tab.

To export the data, head over to the Storage tab.

![SKCRIS Scraper dataset overview](/public/imgs/skcris-actor-dataset-overview.png)



## Sample output from SKCRIS Scraper



### Organisations output

```json
{
  "guid": "cfOrg_32",
  "url": "https://www.skcris.sk/portal/register-organizations?p_p_id=organisationSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&_organisationSearchResult_WAR_cvtiappweb_javax.portlet.action=godetail&guid=cfOrg_32",
  "name": "Company Name, s.r.o.",
  "acronym": null,
  "ičo": "12345678",
  "description": "-",
  "govDept": "bez príslušnosti k orgánu štátu a štátnej správy",
  "skNace": "poradenské služby v oblasti podnikania a riadenia",
  "financingType": "hospodárska organizácia",
  "orgType": "podnikateľský sektor vav",
  "activityMain": "iná prevažujúca činnosť ako výskum a vývoj",
  "activitySpec": "technické vedy / informačné a komunikačné technológie / riadenie procesov",
  "email": [
    "email@address.sk"
  ],
  "phone": "+421 12 3456789",
  "website": "www.example.sk",
  "certificateText": "-",
  "certificate": null,
  "certificateStartDate": null,
  "certificateEndDate": null,
  "activitySpec1": "technické vedy",
  "activitySpec2": "informačné a komunikačné technológie",
  "activitySpec3": "riadenie procesov",
  // Only in detailed entry
  "addresses": [
    {
      "country": "Country [name=Slovensko, code=SK]",
      "countryName": "Slovensko",
      "adrLine1": "123",
      "adrLine2": null,
      "adrLine3": "StreetName",
      "adrLine4": "Okres Prešov",
      "adrLine5": "Prešovský kraj",
      "postCode": "01234",
      "cityTown": "Prešov",
      "cfUri": null,
      "region": "Prešovský kraj",
      "district": "Okres Prešov",
      "township": "Prešov",
      "type": "kontaktná adresa"
    }
  ],
  // Only in detailed entry
  "researchers": [
    {
      "id": 18067,
      "name": "LastName FirstName",
      "roles": [
        {
          "role": "kontaktná osoba"
        }
      ],
      "url": "https://www.skcris.sk/portal/register-researchers?p_p_id=researcherSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_researcherSearchResult_WAR_cvtiappweb_action=goresdetail&id=18067"
    }
  ],
  // Only in detailed entry
  "projects": [
    {
      "id": 5696,
      "name": "Zlepšovanie kvality a zvyšovanie výkonnosti MSP aplikáciou metód maximalizácie podnikateľského úspechu 2",
      "roles": [
        {
          "role": "spoluriešiteľská organizácia"
        }
      ],
      "url": "https://www.skcris.sk/portal/register-projects?p_p_id=projectSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_projectSearchResult_WAR_cvtiappweb_javax.portlet.action=projectgodetail&id=5696"
    }
  ],
  // Only in detailed entry
  "parentOrgs": [],
  // Only in detailed entry
  "childOrgs": [],
  // Only in detailed entry
  "productOutputs": [],
  // Only in detailed entry
  "patentOutputs": [],
  // Only in detailed entry
  "publicationOutputs": [],
  // Only in detailed entry
  "innovationOutputs": [],
  // Only in detailed entry
  "equipmentInfra": [],
  // Only in detailed entry
  "facilityInfra": [],
  // Only in detailed entry
  "serviceInfra": [],
  // Only in detailed entry
  "addressesCount": 1,
  // Only in detailed entry
  "researchersCount": 3,
  // Only in detailed entry
  "projectsCount": 1,
  // Only in detailed entry
  "parentOrgsCount": 0,
  // Only in detailed entry
  "childOrgsCount": 0,
  // Only in detailed entry
  "productOutputsCount": 0,
  // Only in detailed entry
  "patentOutputsCount": 0,
  // Only in detailed entry
  "publicationOutputsCount": 0,
  // Only in detailed entry
  "innovationOutputsCount": 0,
  // Only in detailed entry
  "equipmentInfraCount": 0,
  // Only in detailed entry
  "facilityInfraCount": 0,
  // Only in detailed entry
  "serviceInfraCount": 0,
  "metadata": {
    "actorId": "2YjGNj4zGPIntw4wh",
    "actorRunId": "mFTsl9nmpSle091a7",
    "actorRunUrl": "https://console.apify.com/actors/2YjGNj4zGPIntw4wh/runs/mFTsl9nmpSle091a7",
    "contextId": "Q1QNClHk6C",
    "requestId": "IXPi6SyvIPdkyxe",
    "originalUrl": "https://www.skcris.sk/portal/register-organizations?p_p_id=organisationSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&_organisationSearchResult_WAR_cvtiappweb_javax.portlet.action=godetail&guid=cfOrg_32",
    "loadedUrl": "https://www.skcris.sk/portal/register-organizations?p_p_id=organisationSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&_organisationSearchResult_WAR_cvtiappweb_javax.portlet.action=godetail&guid=cfOrg_32",
    "dateHandled": "2023-04-28T17:29:19.255Z",
    "numberOfRetries": 0
  },
}
```

### Researchers output

```json
{
  "guid": "cfPers_1123",
  "url": "https://www.skcris.sk/portal/register-researchers?p_p_id=researcherSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&_researcherSearchResult_WAR_cvtiappweb_javax.portlet.action=godetail&guid=cfPers_1123",
  "fullName": "FirstName LastName",
  "datasource": "výskumník - crepč",
  "industry": "ostatné príbuzné odbory pedagogických vied, učiteľstva a vychovávateľstva",
  "orgType": "sektor vysokých škôl",
  "keywords": [],
  "annotation": "-",
  "website": null,
  "email": [
    "email@example.sk"
  ],
  // Only in detailed entry
  "organisations": [
    {
      "id": 1264,
      "name": "Univerzita Komenského v Bratislave, Pedagogická fakulta",
      "roles": [
        {
          "role": "výskumník"
        }
      ],
      "url": "https://www.skcris.sk/portal/register-organizations?p_p_id=organisationSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_organisationSearchResult_WAR_cvtiappweb_javax.portlet.action=organizationgodetail&id=1264"
    }
  ],
  // Only in detailed entry
  "projects": [],
  // Only in detailed entry
  "productOutputs": [],
  // Only in detailed entry
  "patentOutputs": [],
  // Only in detailed entry
  "publicationOutputs": [
    {
      "id": 459296,
      "name": "Ako viesť deti k prekonávaniu psychických problémov...",
      "roles": [
        {
          "role": "autor"
        }
      ],
      "url": "https://www.skcris.sk/portal/register-researchers?p_p_id=researcherSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_researcherSearchResult_WAR_cvtiappweb_action=linkedvysledky&type=publication&id=459296"
    }
  ],
  // Only in detailed entry
  "innovationOutputs": [],
  // Only in detailed entry
  "citationOutputs": [],
  // Only in detailed entry
  "organisationsCount": 1,
  // Only in detailed entry
  "projectsCount": 0,
  // Only in detailed entry
  "productOutputsCount": 0,
  // Only in detailed entry
  "patentOutputsCount": 0,
  // Only in detailed entry
  "publicationOutputsCount": 6,
  // Only in detailed entry
  "innovationOutputsCount": 0,
  // Only in detailed entry
  "citationOutputsCount": 0,
  "metadata": {
    "actorId": "2YjGNj4zGPIntw4wh",
    "actorRunId": "9QSIhfpo23yTt9USW",
    "actorRunUrl": "https://console.apify.com/actors/2YjGNj4zGPIntw4wh/runs/9QSIhfpo23yTt9USW",
    "contextId": "cP7NpdPf8L",
    "requestId": "wzi5GGf8ODheLh7",
    "originalUrl": "https://www.skcris.sk/portal/register-researchers?p_p_id=researcherSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&_researcherSearchResult_WAR_cvtiappweb_javax.portlet.action=godetail&guid=cfPers_1123",
    "loadedUrl": "https://www.skcris.sk/portal/register-researchers?p_p_id=researcherSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&_researcherSearchResult_WAR_cvtiappweb_javax.portlet.action=godetail&guid=cfPers_1123",
    "dateHandled": "2023-04-28T19:22:49.801Z",
    "numberOfRetries": 0
  },
}
```

### Projects output

```json
{
  "guid": "cfProj_15010",
  "url": "https://www.skcris.sk/portal/register-projects?p_p_id=projectSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&_projectSearchResult_WAR_cvtiappweb_javax.portlet.action=projectgodetail&guid=cfProj_15010",
  "name": "Adaptívne osobné finančné plánovanie šité na mieru a správa aktív a pasív",
  "projectCode": "8179",
  "duration": "01.09.2013 - 31.08.2015",
  "abstract": "Cieľom projektu TAP-PALM je dodávať podporný softvér finančným plánovačom zákazníkov, ktorý poskytuje bezprecedentné prispôsobenie potrebám a cieľom klientov počas životnosti finančného plánu. Nový prístup využíva hybridné matematické modely (analytická simulácia a simulácia založená na agentoch) a BPM orientované na cieľ.",
  "keywords": [],
  "grantCallName": "04.03 2013 EUREKA SK Výzva MŠVVaŠ SR na predkladanie návrhov projektov na získanie účelovej podpory na spolufinancovanie projektov programu EUREKA SK",
  "awardAmountEur": 150000,
  "activitySpec": "prírodné vedy / počítačové a informatické vedy (okrem 020300 informačné a komunikačné technológie a 050804 knižničná a informačná veda) / ostatné príbuzné odbory informatických vied",
  "researchType": "aplikovaný (priemyselný) výskum",
  "programmeType": "medzinárodná spolupráca - eureka",
  "durationStart": "01.09.2013",
  "durationEnd": "31.08.2015",
  "activitySpec1": "prírodné vedy",
  "activitySpec2": "počítačové a informatické vedy (okrem 020300 informačné a komunikačné technológie a 050804 knižničná a informačná veda)",
  "activitySpec3": "ostatné príbuzné odbory informatických vied",
  // Only in detailed entry
  "researchers": [
    {
      "id": 24665,
      "name": "LastName FirstName",
      "roles": [
        {
          "role": "riešiteľ"
        }
      ],
      "url": "https://www.skcris.sk/portal/register-researchers?p_p_id=researcherSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_researcherSearchResult_WAR_cvtiappweb_action=goresdetail&id=24665"
    }
  ],
  // Only in detailed entry
  "organisations": [
    {
      "id": 4026,
      "name": "Company Name, s.r.o.",
      "roles": [
        {
          "role": "žiadateľ"
        }
      ],
      "url": "https://www.skcris.sk/portal/register-organizations?p_p_id=organisationSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_organisationSearchResult_WAR_cvtiappweb_javax.portlet.action=organizationgodetail&id=4026"
    }
  ],
  // Only in detailed entry
  "productOutputs": [],
  // Only in detailed entry
  "patentOutputs": [],
  // Only in detailed entry
  "publicationOutputs": [],
  // Only in detailed entry
  "innovationOutputs": [],
  // Only in detailed entry
  "equipmentInfra": [],
  // Only in detailed entry
  "facilityInfra": [],
  // Only in detailed entry
  "serviceInfra": [],
  // Only in detailed entry
  "documents": [],
  // Only in detailed entry
  "researchersCount": 1,
  // Only in detailed entry
  "organisationsCount": 1,
  // Only in detailed entry
  "productOutputsCount": 0,
  // Only in detailed entry
  "patentOutputsCount": 0,
  // Only in detailed entry
  "publicationOutputsCount": 0,
  // Only in detailed entry
  "innovationOutputsCount": 0,
  // Only in detailed entry
  "equipmentInfraCount": 0,
  // Only in detailed entry
  "facilityInfraCount": 0,
  // Only in detailed entry
  "serviceInfraCount": 0,
  // Only in detailed entry
  "documentsCount": 0,
  "metadata": {
    "actorId": "2YjGNj4zGPIntw4wh",
    "actorRunId": "2OwhtQlclOj853cj2",
    "actorRunUrl": "https://console.apify.com/actors/2YjGNj4zGPIntw4wh/runs/2OwhtQlclOj853cj2",
    "contextId": "bPSoxOMbEc",
    "requestId": "PCFg1VineLv8yq5",
    "originalUrl": "https://www.skcris.sk/portal/register-projects?p_p_id=projectSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&_projectSearchResult_WAR_cvtiappweb_javax.portlet.action=projectgodetail&guid=cfProj_15010",
    "loadedUrl": "https://www.skcris.sk/portal/register-projects?p_p_id=projectSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&_projectSearchResult_WAR_cvtiappweb_javax.portlet.action=projectgodetail&guid=cfProj_15010",
    "dateHandled": "2023-04-28T18:49:15.444Z",
    "numberOfRetries": 0
  },
}
```




## How to integrate SKCRIS Scraper with other services, APIs or Actors



You can connect the actor with many of the
[integrations on the Apify platform](https://apify.com/integrations).
You can integrate with Make, Zapier, Slack, Airbyte, GitHub, Google Sheets, Google Drive,
[and more](https://docs.apify.com/integrations).
Or you can use
[webhooks](https://docs.apify.com/integrations/webhooks)
to carry out an action whenever an event occurs, e.g. get a notification whenever
Instagram API Scraper successfully finishes a run.



## Use SKCRIS Scraper with Apify API



The Apify API gives you programmatic access to the Apify platform.
The API is organized around RESTful HTTP endpoints that enable you to manage,
schedule and run Apify actors. The API also lets you access any datasets,
monitor actor performance, fetch results, create and update versions, and more.

To access the API using Node.js, use the `apify-client` NPM package.
To access the API using Python, use the `apify-client` PyPI package.

Check out the [Apify API reference](https://docs.apify.com/api/v2) docs
for full details or click on the
[API tab](https://apify.com/jurooravec/skcris-scraper/api)
for code examples.



## Is it legal to scrape SKCRIS?



It is legal to scrape publicly available data such as product descriptions,
prices, or ratings. Read Apify's blog post on
[the legality of web scraping](https://blog.apify.com/is-web-scraping-legal/)
to learn more.

However, the following datasets include personal data:

- Organisations dataset includes info about employees or researchers.
  - Fields: email, phone, researchers
  - By default, this personal data is redacted, and in such case, it's safe to scrape the data.
- Researchers dataset includes info about researchers.
  - Fields: guid, url, fullName, email
  - By default, this personal data is redacted, and in such case, it's safe to scrape the data.
- Projects dataset includes info about researchers.
  - Fields: researchers
  - By default, this personal data is redacted, and in such case, it's safe to scrape the data.

To get the unredacted data, toggle on the "Include personal data" actor input.

> **Warning:** Including personal data is done at your own risk. It is your
responsibility to make sure you have obtained consent or have a legal basis
for using the data.
>
> By using this actor, you agree not to hold the author of this actor liable for privacy
or data-related issues that may arise during its use.

Redacted fields may show a message like this instead of the actual value:

```txt
<Redacted property "email". To include the actual value, toggle ON the Actor input option "Include personal data">
```




## Who can I contact for issues with SKCRIS actor?



To report issues and find help,
head over to the
[Discord community](https://discord.com/channels/801163717915574323), or email me at juraj[dot]oravec[dot]josefson[at]gmail[dot]com


