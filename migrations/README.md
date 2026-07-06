# Creating MongoDB Indexes

## Via Atlas Collections UI (easiest, no command line)

For each collection listed below, go to Browse Collections → click the collection → Indexes tab → Create Index, then paste the fields:

### users
| Field | Type | Unique |
|---|---|---|
| email | 1 (ascending) | Yes |

### products
| Field | Type |
|---|---|
| publisher_id | 1 (ascending) |

### license_templates
| Field | Type |
|---|---|
| product_id | 1 (ascending) |

### licenses
| Field | Type | Unique | Options |
|---|---|---|---|
| license_key | 1 (ascending) | Yes | - |
| product_id | 1 (ascending) | No | - |
| customer_email | 1 (ascending) | No | - |
| status | 1 (ascending) | No | - |
| license_key | text | No | (text index, include customer_name, customer_email as text) |
| expires_at | 1 (ascending) | No | Partial filter: { status: "active" } |

### activations
| Field | Type | Unique | Options |
|---|---|---|---|
| license_id | 1 (ascending) | No | - |
| hardware_id | 1 (ascending) | No | - |
| license_id + hardware_id (compound) | 1, 1 | Yes | Partial filter: { is_active: true } |

### audit_logs
| Field | Type |
|---|---|
| created_at | -1 (descending) |

### rate_limits
| Field | Type |
|---|---|
| identifier | 1 (ascending) |
| endpoint | 1 (ascending) |
| window_start | 1 (ascending) | TTL: 120 seconds |

## Via MongoDB Compass (GUI)

Download from https://www.mongodb.com/products/compass
- Connect to your Atlas cluster
- Go to each collection → Indexes tab → Create Index
- Use the fields above
