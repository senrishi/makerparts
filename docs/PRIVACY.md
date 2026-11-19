# Privacy and permissions

## Data stored

MakerParts stores projects, part names, product links, model and SKU details, categories, quantities, prices, purchase status, notes, and display preferences in the browser profile where it is installed. Backups are JSON files created only when you export them.

The library stays in the current browser profile by default. Optional Cloud sync uses Supabase to authenticate your account and store a copy of your projects and saved parts, including links, notes, and prices. It keeps an offline copy in the browser. Signing out stops sync on that device. MakerParts does not transmit your live store cart session, and has no advertising, analytics, or telemetry.

## Website access

- **Storage** keeps the library and preferences in the current browser profile.
- **Active tab and scripting** allow product capture after you click the toolbar button on a page.
- **MakerBazar site access** enables the floating button, exact variant capture, cart preview, and user-requested cart operations on `makerbazar.in` and `www.makerbazar.in`.

The extension requests access to the Supabase project only when you enable Cloud sync. The extension has no persistent site access to other stores. Product details on other sites are captured only after the toolbar action and remain editable before saving.

## Store cart actions

Save Cart reads the current MakerBazar cart and saves its lines to a selected project. It does not change the store cart. Clear Cart immediately empties the MakerBazar cart when clicked. Restore Project replaces it with validated Planned parts after showing a preview and requiring the replacement checkbox. The extension does not submit checkout or place orders.

## Data retention

Library data remains in the browser profile across normal restarts. Uninstalling MakerParts or deleting the browser profile can remove that data. Export a backup before uninstalling or replacing an installation if you need to preserve the library.
