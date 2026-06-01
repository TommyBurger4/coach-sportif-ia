# Nutrition Et Frigo

## Regle D'alignement

Avant de planifier repas, calories ou courses, verifier :

- objectif actuel
- periode actuelle
- charge d'entrainement prevue
- demande precise du moment

La nutrition doit soutenir la phase en cours : perte de gras, performance sportive, prise de muscle utile, recuperation ou maintien.

## Objectifs Nutrition

- tendre vers un objectif de composition corporelle
- optimiser la performance
- preserver la recuperation

## Ordre Obligatoire

1. Planifier les entrainements.
2. Analyser la charge physique.
3. Planifier repas et collations.
4. Generer la liste de courses.

## Adaptation

Adapter la nutrition selon :

- periode actuelle
- objectif
- charge d'entrainement
- jour jambes
- jour sport principal
- running
- recuperation

Regles :

- jour jambes : plus de glucides
- jour sport principal : nutrition performance
- jour repos : plus leger
- dejeuner en cours : prioriser les repas transportables en tupperware

## Suivi Poids

Check poids :

- minimum 2 fois par semaine
- idealement le matin a jeun

Analyser la tendance, pas les fluctuations journalieres.

## Frigo

Suivre :

- ce qu'il reste
- ce qu'il manque
- quoi cuisiner
- quoi acheter

Eviter le gaspillage.

## Courses Et Google Calendar

Quand Google Calendar contient un evenement du type :

- Faire courses
- Courses
- Acheter a manger
- Supermarche
- Drive
- Ravitaillement

Le coach doit preparer un rappel de courses utile avant l'evenement ou pendant la planification.

Avant de proposer la liste :

1. Lire l'objectif actuel et la periode actuelle.
2. Lire `data/fridge_inventory.json`.
3. Lire les repas prevus ou les besoins nutritionnels de la semaine.
4. Tenir compte des jours muscu, sport principal, repos et mobilite.
5. Prioriser les aliments a utiliser vite.
6. Generer une liste de courses adaptee aux macros, au budget serre et a la recuperation.

La liste doit couvrir les bases d'une nutrition equilibree :

- proteines maigres et pratiques
- glucides utiles pour entrainement/sport principal
- legumes et fruits
- sources de lipides de qualite
- options petit-dejeuner
- options rapides pour les soirs charges
- aliments de secours peu chers

Ne pas proposer toujours les memes repas type pates/poulet.

Les repas du midi doivent etre prioritairement compatibles tupperware :

- faciles a preparer la veille ou le matin
- transportables
- bons froids ou rechauffables
- riches en proteines
- avec glucides ajustes selon entrainement/sport principal
- legumes faciles a integrer
- sauce controlee pour rester compatible avec la seche

Varier les sources :

- proteines : poulet, dinde, oeufs, thon, sardines, skyr/fromage blanc, legumes secs selon tolerance
- glucides : riz, pates, pommes de terre, semoule, avoine, pain complet, wraps
- legumes : surgeles, haricots, petits pois, legumes de saison
- fruits : bananes, pommes, fruits de saison
- lipides : huile d'olive, oeufs, poissons gras, fromage dose
- liquides utiles : lait, creme legere si elle sert une recette compatible avec les macros

Chaque liste de courses doit distinguer :

- indispensables
- optionnels pour varier
- a acheter seulement si budget OK
- aliments deja presents dans le frigo a ne pas racheter

## Repas Prepares Et Decrementation Du Frigo

Quand le coach propose un repas avec quantites precises, il ne doit pas retirer automatiquement les aliments du frigo.

Le frigo ne doit etre decremente qu'apres confirmation explicite de l'utilisateur :

- "valide"
- "je l'ai prepare"
- "repas prepare"
- bouton "Prepare" dans le dashboard

Apres confirmation, soustraire les ingredients utilises de `data/fridge_inventory.json`.

Si l'utilisateur modifie les quantites ou remplace un aliment, utiliser les quantites reellement preparees.

Les repas proposes pour le midi doivent etre prioritairement adaptes au tupperware.

## Journalisation Nutrition

Suivre dans `data/nutrition_log.csv` :

- calories
- proteines
- glucides
- lipides
- repas
- faim
- energie
- performance ressentie
