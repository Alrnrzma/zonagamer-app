import { AppAction, Role } from "../types";

const matrix: Record<Role, Record<AppAction, boolean>> = {
  admin: {
    "venue:create": true,
    "venue:update": true,
    "venue:delete": true,

    "game:create": true,
    "game:update": true,
    "game:delete": true,

    "tourn:create": true,
    "tourn:update": true,
    "tourn:delete": true,

    "event:create": true,
    "event:update": true,
    "event:delete": true,
  },

  user: {
    "venue:create": false,
    "venue:update": false,
    "venue:delete": false,

    "game:create": false,
    "game:update": false,
    "game:delete": false,

    "tourn:create": false,
    "tourn:update": false,
    "tourn:delete": false,

    "event:create": false,
    "event:update": false,
    "event:delete": false,
  },

  associated: {
    "venue:create": false,
    "venue:update": false,
    "venue:delete": false,

    "game:create": false,
    "game:update": false,
    "game:delete": false,

    "tourn:create": false,
    "tourn:update": false,
    "tourn:delete": false,

    "event:create": false,
    "event:update": false,
    "event:delete": false,
  },
};

export function can(role: Role, action: AppAction) {
  return !!matrix[role]?.[action];
}