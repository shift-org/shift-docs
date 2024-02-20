# Understanding the theme

**Important: changes can't be done in the Public directory.**

See section below for more details.

## How the theme works
The theme is a [Hugo](https://gohugo.io/) theme ([Universal](https://themes.gohugo.io/hugo-universal-theme/) is the name of the particular one we chose). All of the edits related to the theme and its content are done in **shift-docs/site**.

Here's an overview of the sub-directories: 
- **Archetypes:** TO BE VERIFIED. 
- **Content:** this is where the different content for respective pages are stored (most of them being in **content/pages**). 

    Some examples of such pages: **pages/get-involved.md**, **pages/pedalpalooza.md** and **pages/who-we-are.md** which all of them are linked as children of navbar items. 

    - Archive: This is where we keep pages that are older and unlikely to be updated.
    - Blog: This is a section that came with the theme that could be useful but has never been implemented yet (like data/features and data/testimonials). 
    - Pages: This is where the majority of the page content from the site are located
    - Playbooks: this is documentation (somewhat like shift-docs/docs but the content here is accessible via the website, unlike Docs). 

- **Data:** This is where more permanent short content is stored (like the carousel text/settings on the home page).

    - Carousel: This is where the text/settings are defined for the carousel on the home page. There are four properties needed for each slide: 
      - Weight: this number represents the order of the slide. 
      - Title: this is the text displayed on the slide when we are viewing the page in the browser. 
      - Description: TO BE VERIFIED 
      - Image: a path to the image used

    - Clients: This is the theme concept we use to represent the "Sponsors" section (on the home page). This could be changed eventually to "Sponsors". 

    - Contact-us-emails: TO BE VERIFIED
    - Features: This is a section that came with the theme that could be useful but has never been implemented yet (like content/blog and data/testimonials). 
    - Testimonials: This is a section that came with the theme that could be useful but has never been implemented yet (like data/features and data/testimonials). 
           
- **Layouts:** Contain theme partials (HTML structure). 
- **Public:** This is the page rendered by the browser. *No edits should be done here.* This directory is the site that is rendered in the browser. That directory should remain but edits should not be made. 
    
- **Static:** 
    - Admin: TO BE VERIFIED
    - Images: Where all images are stored
- **Themes:** this is what what imported and edited to create the current Shift to Bike theme. Styles have been changed within the one sub repository: s2b_hugo_theme. The sub-sub-repositories include: 
    - Archetypes: TO BE VERIFIED
    - i18n: TO BE VERIFIED
    - images: generic images form the original theme (Universal Hugo theme).
    - Layouts: TO BE VERIFIED
    - Static: various color themes that were available. style.default.css is the one that was used by this project and minor changes were added to another CSS filed named custom.css (themes/s2b_hugo_theme/static/css)


#### Definition of terms used in this document
1. navbar items
2. children of navbar items
3. External link icon (icon name: external-link-alt_Font)
4. home logo

![annotated screenshot of homepage showing 4 items above](./images/THEME_editing_terms.png)

## Navbar items & children
The navbar items (dropdown) are defined in shift-docs/site/config.toml. On 01/03/19 they are: Calendar, Featured Events, Community and About.
- All four dropdowns have children, some that link to on-site pages and some leading to off-site pages (marked by an external link icon before their name).
- The navbar items (dropdown) start with: **[[menu.main]]**
- The double square brackets are TO BE VERIFIED. 
- A name is given to the item below the **[[menu.main]]** and a weight (order in which it will show up). 
	 
### Children of navbar items (dropdowns)
They start with a comment **#Child of calendar** for clarity. After the comment, we use the **[[menu.main]]**, as with the parent. 

We have defined 2-3 properties for the children: **URL**, **parent** and **identifier**. 
- **URL:** points to the page
- **Parent:** set on of the navbar item as it’s parent (by using the parent’s name)
- **Identifier:** only used in some cases, is an additional way to refer to the child. It is used to link a page to the Child associated with in. 

Example of how to use **Identifier**: In **shift-docs/site/content/pages/lead-a-ride.md**, a Parent property is set to "communitynav", which is the identifier of the Child named "Community". 
