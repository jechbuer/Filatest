# GitHub Actions Workflow

Da dein Token keinen `workflow` Scope hat, füge diesen Workflow manuell über die GitHub UI hinzu:

## Schritte:

1. Gehe zu https://github.com/jechbuer/Filatest
2. Klicke auf "Actions" Tab
3. Klicke "set up a workflow yourself"
4. Füge folgenden Code ein:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main, master ]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
          
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

5. Committe als `.github/workflows/deploy.yml`

## ODER: Manuelle Pages-Aktivierung

1. Settings → Pages
2. Source: Deploy from a branch
3. Branch: main /root (or /docs)
4. Save

Die App ist dann verfügbar unter:
https://jechbuer.github.io/Filatest/
