# Core User Flow (MVP Navigation)

# **1\. Core User Flow (MVP Navigation)**

This defines how users move through the app.

1. ### **Search Flow:** This is the user flow of the hecta app, from entry to action. More explanation is given in each subsection

Entry → Select Intent → Choose Location → View Listings → Apply Filters → View Property → Take Action

2. ### **Step Breakdown**

**1\. Intent Selection:** Here, the users are asked what they actually want to do on the app if it is to buy a property or rent a property

* Rent  
* Buy

**2\. Location Selection:** Here, the users are asked to select their preferred location

* State → City → Area (we should discuss)

**3\. Listings Page:** Here, the users get to see properties in their location

* Grid/List view of properties  
* Map view (recommended in the future)

**4\. Filtering System:** They can filter based on their preferred choices as displayed below

* Price range  
* Property type (House, Apartment, etc.)  
* Bedrooms / Bathrooms  
* Furnishing  
* Serviced level  
* Pets allowed  
* Move-in date  
* Short-term vs Long-term  
* Amenities

**5\. Property Details Page:** They see the full details of the clicked on property here

* Full listing info  
* Images (required)  
* Videos (optional but HIGH value in Lagos market)  
* Apply / Save


# Property Data Model (Backend Structure)

#  **Property Data Model (Backend Structure)** 

### **Core Fields:** Required fields for a property

* Price  
* Other Charges (e.g., security deposit, agency fee)  
* Location  
* Property Type (House, Apartment, Duplex, etc.)  
* Rooms (Bedrooms \+ Bathrooms)  
* Size (sqm)

### **Additional Details**

* Serviced: No / Semi / Fully  
* Furnishing: Furnished / Semi / Unfurnished  
* Floor (or N/A)  
* Pets Allowed (Yes/No)  
* Move-in Date  
* Lease Type: Short-term / Long-term

### **Media**

* Images (required)  
* Videos (optional \- to be discussed)

### **Description**

* Text field

### **Amenities**

* List format (e.g., Generator, Parking, Security, Gym)  
* Can be predefined \+ custom

# Landlord Verification System (Trust Layer

# **Landlord Verification System (Trust Layer 1\)**

\*\*Needs to be discussed (too strict \= less listings, too loose \= low quality listing i.e scams, agents) 

### **Required Verification Inputs**

**Identity**

* NIN (or vNIN)  
* Phone OTP verification

**Ownership Proof (1 of them)**

* Certificate of Occupancy (C of O) or   
* Deed of Assignment or  
* Purchase Receipt

**Property Legitimacy**

* Property Address  
* Survey Plan or   
* Land Use Charge proof (optional but strong trust signal)

**Special Case Handling (Important in Lagos)**

* Family Land ("Omo Onile"):  
  * Family Resolution Letter or  
  * Letter of Administration

### **Review System**

* Admin Review (manual approval)

### **Output**

* Verified Landlord   
* Verified Property 

# Tenant / Buyer Verification System

# **Tenant / Buyer Verification System**

## **A. Identity Verification (Trust Layer 2\)**

**Level 1 (Basic)**

* Non needed \- Can browse listings

**Level 2 (Verified Identity) options:** 

* vNIN (16-digit token) \+ Live selfie (liveness check)  
* Live selfie (liveness check) or OTP to registered number

→ Required to:

* Apply to listings  
* Contact landlords

---

## **B. Serious Buyer / Tenant Qualification**

This filters out unserious users : to be discussed 

### **Options (User can choose one)**

**1\. Financial Proof**

* Bank statement linking (API) to verify funds

**2\. Pre-Approval**

* Mortgage pre-approval (for buyers)  
* Proof of funds document

**3\. Legal Representation**

* Lawyer name  
* NBA verification status

---

## **C. Intent Profile (Very Important UX Feature)**

* Timeline (e.g., immediate, 1–3 months)  
* Payment plan:  
  * Full payment  
  * Mortgage  
  * Installments

# Anti-Spam & Trust Systems

# **Anti-Spam & Trust Systems**

## **A. Application Limits**

* Max 5 applications per day  
* Max 30 per month

## **B. Spam Detection**

* Copy-paste messages  
* Repeated listing uploads

## **C. Listing Validation**

* Duplicate listings detection  
* Suspicious pricing flag  
* Missing critical data

# Reporting System

#  **Reporting System**

Users should be able to report:

* Agents  
* Scam listings  
* Spam users

### **Actions**

* Flag listing  
* Flag user

# Ghost Listing Prevention System

# **Ghost Listing Prevention System**

This is VERY important for Nigerian real estate.

### **Possible Approaches**

* Require periodic re-verification (e.g., every 60 days)  
* Auto-expire inactive listings  
* “Still Available?” prompt to landlord

# Dynamic Tenancy Agreement (Advanced Feature)

# **Dynamic Tenancy Agreement (Advanced Feature)**

This can become a **huge differentiator \- removes lawyer fee as well**.

### **Functionality**

* Auto-generate tenancy agreement based on:  
  * Property details  
  * Rent terms  
  * Duration  
  * Tenant \+ landlord info  
* Editable clauses:  
  * Payment structure  
  * Maintenance responsibility  
  * Notice period  
* Export as PDF  
* Optional:  
  * Digital signing

# Key Product Decisions You Should Make Now

# **Key Product Decisions You Should Make Now**

These are things your dev will ask you:

### **1\. Flatmate Feature**

* Recommendation: NOT in MVP  
   It complicates matching logic and UX

### **2\. Videos**

### **3\. Map View**

* Recommendation: future version  
   Start with list \+ filters first

### **4\. Verification Strictness**

* If too strict → low adoption  
* If too loose → scams

# Live Demand Pool \+ Reverse Listings:

**Live Demand Pool \+ Reverse Listings:** 

Verified tenants post what they want and budget; landlords with matching properties get notified. Inverts the whole market.

# Whatsapp first interface:

**Whatsapp-first-interface:**  
Landlord can manage everything from WhatsApp Business. No new app to learn.

