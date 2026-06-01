# Donnees Du Coach

Ce dossier contient des exemples anonymes. Remplacez-les par vos propres donnees avant d'utiliser le coach serieusement.

## Ordre conseille

1. `profile.json`: profil, objectifs, contraintes, periode actuelle.
2. `nutrition_targets.json`: cibles calories/macros.
3. `planned_sessions.json`: seances prevues.
4. CSV d'historique: a remplir progressivement depuis le dashboard.

## Remise a zero

Pour repartir de zero, gardez seulement les en-tetes des CSV et remplacez les JSON par des listes vides ou des objets vides compatibles:

- `planned_sessions.json`: `[]`
- `planned_meals.json`: `[]`
- `weekly_summaries.json`: `[]`
- `fridge_inventory.json`: objet avec `items: []`

Ne committez pas de donnees personnelles reelles dans un repo public.
