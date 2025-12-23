
const subjects = {
  auth: 'auth',
  subscriptions: 'subscriptions',
  products : 'products',
  orders: 'orders',
  payments: 'payments',
  all: 'all'

};
const actions = {
  create: 'create',
  read: 'read',
  readAll: 'readAll',
  update: 'update',
  delete: 'delete',
  manage: 'manage',
};

const allRoles = {
  user: [

    {
      action: actions.read,
      subject: subjects.auth,
    },
    {
      action: actions.update,
      subject: subjects.auth, 
    },
    {
      action: actions.read,
      subject: subjects.subscriptions,
    },
    {action: actions.create,
      subject: subjects.subscriptions,
    },
    {
      action: actions.read,
      subject: subjects.orders,
    },
    {
      action: actions.create,
      subject: subjects.orders,
    },
    {
      action: actions.create,
      subject: subjects.payments,
    },
    {
      action: actions.read,
      subject: subjects.products,
    }

  ],
  admin: [
    {
      action: actions.manage,
      subject: subjects.all,
    },
  ],
}

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
