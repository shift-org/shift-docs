# Understanding the site

The site is built with [Hugo](https://gohugo.io/) with the ([Universal](https://themes.gohugo.io/hugo-universal-theme/) theme. All of the edits related to the theme and its content are done in **shift-docs/site**. see `site/README` for more info.

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
