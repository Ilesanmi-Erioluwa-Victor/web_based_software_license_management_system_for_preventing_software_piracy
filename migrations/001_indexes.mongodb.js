// MongoDB Indexes for License Management System
// Run in MongoDB shell or Compass:
//   mongosh <connection-string> license_manager migrations/001_indexes.mongodb.js

// ===== users collection =====
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

// ===== sessions collection =====
db.sessions.createIndex({ token_hash: 1 });
db.sessions.createIndex({ user_id: 1 });
db.sessions.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });

// ===== products collection =====
db.products.createIndex({ publisher_id: 1 });
db.products.createIndex({ name: 1 });

// ===== license_templates collection =====
db.license_templates.createIndex({ product_id: 1 });

// ===== licenses collection =====
db.licenses.createIndex({ license_key: 1 }, { unique: true });
db.licenses.createIndex({ product_id: 1 });
db.licenses.createIndex({ customer_email: 1 });
db.licenses.createIndex({ status: 1 });
db.licenses.createIndex({ expires_at: 1 }, { partialFilterExpression: { status: 'active' } });
db.licenses.createIndex(
    { license_key: 'text', customer_name: 'text', customer_email: 'text' },
    { weights: { license_key: 10, customer_name: 5, customer_email: 3 }, name: 'license_search' }
);

// ===== activations collection =====
db.activations.createIndex({ license_id: 1 });
db.activations.createIndex({ hardware_id: 1 });
db.activations.createIndex({ license_id: 1, hardware_id: 1 }, { unique: true, partialFilterExpression: { is_active: true } });

// ===== audit_logs collection =====
db.audit_logs.createIndex({ action: 1 });
db.audit_logs.createIndex({ license_id: 1 });
db.audit_logs.createIndex({ actor_id: 1 });
db.audit_logs.createIndex({ created_at: -1 });

// ===== rate_limits collection =====
db.rate_limits.createIndex({ identifier: 1, endpoint: 1 });
db.rate_limits.createIndex({ window_start: 1 }, { expireAfterSeconds: 120 });

print('All indexes created successfully.');
