# n8n-nodes-vikunja

Nœud communautaire n8n pour [Vikunja](https://vikunja.io).

Ce dépôt est un **fork** de [go-vikunja/n8n-vikunja-nodes](https://github.com/go-vikunja/n8n-vikunja-nodes),
remis à niveau sur l'API Vikunja **v2.5.0**. L'amont était resté sur un état de
l'API où plusieurs routes avaient bougé, et où la moitié des possibilités
récentes (filtres, pagination, pièces jointes, filtres enregistrés…) n'étaient
pas exposées.

Les noms de package et de nœuds sont **inchangés** (`n8n-nodes-vikunja`,
`n8n-nodes-vikunja.vikunja`, `n8n-nodes-vikunja.vikunjaTrigger`) : les workflows
existants continuent de fonctionner après mise à jour, sans réécriture.

## Corrections de bugs

| Problème | Symptôme | Correction |
| --- | --- | --- |
| `Get All Link Shares` pointait sur `/project/{id}/shares` | 404 systématique | route `/projects/{id}/shares` |
| `Remove a User From a Team` envoyait un ID numérique | 404 « The user does not exist » | Vikunja adresse les membres par `username` |
| `Toggle a User's Admin Status` sans le suffixe `/admin` | 405 Method Not Allowed | route `/teams/{id}/members/{username}/admin` |
| `Add a User` (projet) envoyait `user_id` | 404 « The user does not exist » | le corps attend `username` (+ `permission`) |
| `Update` écrasait les champs non renseignés | description, échéance, rappels effacés | option **Merge With Existing** (activée par défaut) |
| Sélecteur de vue cassé hors ressource « project » | liste vide sur les tâches | le projet est lu quel que soit le paramètre qui le porte |
| Liste d'événements webhook figée | `task.overdue`, `tasks.overdue`, `task.reminder.fired` absents | liste chargée depuis `GET /webhooks/events` |
| Test d'identifiants sur `/token/test` | dépend des permissions du jeton | test sur `/user` |
| URL d'API avec slash final | requêtes vers `//tasks` | slash final ignoré des deux côtés |

## Nouveautés

**Pagination.** Toutes les opérations « get many » ont le couple
`Return All` / `Limit` habituel de n8n. Vikunja plafonne `per_page` côté serveur
(50 par défaut) : le nœud enchaîne les pages au lieu de s'arrêter à la première.
Concrètement, `Get Many` sur les labels renvoyait 50 lignes au maximum, il les
renvoie maintenant toutes.

**Filtres et tri sur les tâches.** Nouvelle section *Query Options* :
`filter`, `filter_include_nulls`, `filter_timezone`, `sort_by`, `order_by`,
`s`, `expand`. Plus besoin de tout refiltrer avec un nœud Filter en aval.

**Nouvelles ressources**

- **User** — utilisateur courant, recherche d'utilisateurs, fuseaux horaires.
  C'est ce qui permet de résoudre un ID d'assigné depuis un workflow.
- **Saved Filter** — création, lecture, mise à jour, suppression de `/filters`.
- **Notification** — boîte de réception, marquage lu/non lu.

**Nouvelles opérations sur les tâches**

- `Get Many Across All Projects` (`GET /tasks`) et `Get Many in a View`
  (respecte le filtre et le tri de la vue)
- `Get by Index` (l'identifiant `PROJ-42`)
- Pièces jointes : téléversement (binaire), téléchargement (binaire), liste,
  suppression
- `Update Many` (mise à jour en masse via `/tasks/bulk`)
- `Set Labels` et `Assign Multiple Users` (remplacement en un appel)
- `Move to a Bucket`, `Mark as Read`, `Duplicate`
- `Subscribe` / `Unsubscribe`, `Get All Reactions`, `Get a Comment`,
  `Get All Assignees`
- **Reminders** en création et mise à jour, absolus ou relatifs à une date

**Nouvelles opérations sur les projets** — `Get All Kanban Buckets`,
`Get a Link Share`, `Get All Users With Access` (`/projectusers`, utile pour
retrouver les IDs d'assignés), `Subscribe` / `Unsubscribe`, filtre
`Include Archived Projects`.

**Trigger** — vérification de la signature HMAC-SHA256 (`X-Vikunja-Signature`)
quand un secret est renseigné. Sans secret, l'URL du webhook reste appelable par
n'importe qui, c'est le comportement d'origine et il est conservé par défaut.

## Installation

```bash
npm install
npm run build
npm pack
```

Puis dans le dossier des nœuds communautaires de n8n (`~/.n8n/nodes`) :

```bash
tar xzf n8n-nodes-vikunja-<version>.tgz \
    -C node_modules/n8n-nodes-vikunja --strip-components=1
```

et redémarrer n8n.

## Identifiants

- **API URL** : url complète avec le suffixe `/api/v1`
- **API Token** : jeton créé dans *Settings → API Tokens*, ou un JWT

Les jetons d'API Vikunja portent des permissions par route. Un jeton qui ne
couvre pas une ressource renvoie `403 Forbidden` sur cette ressource
uniquement — pensez-y avant de conclure à un bug du nœud.

## Suivi de l'amont

```bash
git fetch upstream
git merge upstream/main
```

`origin` pointe sur le fork, `upstream` sur `go-vikunja/n8n-vikunja-nodes`.

## Licence

MIT, comme l'amont.
