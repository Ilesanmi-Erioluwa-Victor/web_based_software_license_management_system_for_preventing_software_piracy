<?php

namespace App\Config;

use MongoDB\Client;
use MongoDB\Database as MongoDatabase;
use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;

class Database
{
    private static ?Client $client = null;
    private static ?MongoDatabase $db = null;

    public static function getDb(): MongoDatabase
    {
        if (self::$db === null) {
            $uri = $_ENV['DB_URI'] ?? 'mongodb://localhost:27017';
            $dbName = $_ENV['DB_DATABASE'] ?? 'license_manager';

            try {
                self::$client = new Client($uri);
                self::$db = self::$client->selectDatabase($dbName);
                self::$db->command(['ping' => 1]);
            } catch (\Exception $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Database connection failed']);
                exit;
            }
        }
        return self::$db;
    }

    public static function collection(string $name): \MongoDB\Collection
    {
        return self::getDb()->selectCollection($name);
    }

    public static function findOne(string $collection, array $filter = [], array $options = []): ?array
    {
        $doc = self::collection($collection)->findOne(self::convertFilterIds($filter), $options);
        return $doc ? self::docToArray($doc) : null;
    }

    public static function findMany(string $collection, array $filter = [], array $options = []): array
    {
        $cursor = self::collection($collection)->find(self::convertFilterIds($filter), $options);
        $results = [];
        foreach ($cursor as $doc) {
            $results[] = self::docToArray($doc);
        }
        return $results;
    }

    public static function insertOne(string $collection, array $document): string
    {
        $doc = self::prepareDoc($document);
        $result = self::collection($collection)->insertOne($doc);
        return (string) $result->getInsertedId();
    }

    public static function updateOne(string $collection, array $filter, array $update): int
    {
        $result = self::collection($collection)->updateOne(
            self::convertFilterIds($filter),
            ['$set' => self::prepareDoc($update)]
        );
        return $result->getModifiedCount();
    }

    public static function updateMany(string $collection, array $filter, array $update): int
    {
        $result = self::collection($collection)->updateMany(
            self::convertFilterIds($filter),
            ['$set' => self::prepareDoc($update)]
        );
        return $result->getModifiedCount();
    }

    public static function replaceOne(string $collection, array $filter, array $document): int
    {
        $result = self::collection($collection)->replaceOne(
            self::convertFilterIds($filter),
            self::prepareDoc($document)
        );
        return $result->getModifiedCount();
    }

    public static function deleteOne(string $collection, array $filter): int
    {
        $result = self::collection($collection)->deleteOne(self::convertFilterIds($filter));
        return $result->getDeletedCount();
    }

    public static function deleteMany(string $collection, array $filter): int
    {
        $result = self::collection($collection)->deleteMany(self::convertFilterIds($filter));
        return $result->getDeletedCount();
    }

    public static function count(string $collection, array $filter = []): int
    {
        return self::collection($collection)->countDocuments(self::convertFilterIds($filter));
    }

    public static function aggregate(string $collection, array $pipeline): array
    {
        $cursor = self::collection($collection)->aggregate($pipeline);
        $results = [];
        foreach ($cursor as $doc) {
            $results[] = self::docToArray($doc);
        }
        return $results;
    }

    public static function id(string $id): ObjectId
    {
        return new ObjectId($id);
    }

    public static function utcDateTime(string $date): UTCDateTime
    {
        return new UTCDateTime(strtotime($date) * 1000);
    }

    private static function convertFilterIds(array $filter): array
    {
        $converted = [];
        foreach ($filter as $key => $value) {
            if ($key === '_id' && is_string($value)) {
                $converted[$key] = new ObjectId($value);
            } elseif (in_array($key, ['user_id', 'product_id', 'publisher_id', 'template_id', 'license_id', 'actor_id']) && is_string($value)) {
                try {
                    $converted[$key] = new ObjectId($value);
                } catch (\Exception $e) {
                    $converted[$key] = $value;
                }
            } elseif (is_array($value)) {
                $converted[$key] = self::convertFilterIds($value);
            } else {
                $converted[$key] = $value;
            }
        }
        return $converted;
    }

    private static function prepareDoc(array $doc): array
    {
        $prepared = [];
        foreach ($doc as $key => $value) {
            if (in_array($key, ['user_id', 'product_id', 'publisher_id', 'template_id', 'license_id', 'actor_id']) && is_string($value) && strlen($value) === 24) {
                try {
                    $prepared[$key] = new ObjectId($value);
                } catch (\Exception $e) {
                    $prepared[$key] = $value;
                }
            } elseif (is_array($value) || is_object($value)) {
                $prepared[$key] = $value;
            } else {
                $prepared[$key] = $value;
            }
        }
        return $prepared;
    }

    public static function docToArray($doc): array
    {
        if ($doc instanceof \MongoDB\Model\BSONDocument) {
            $doc = $doc->bsonSerialize();
        }
        $array = (array) $doc;
        $result = [];
        foreach ($array as $key => $value) {
            if ($value instanceof ObjectId) {
                $result[$key === '_id' ? 'id' : $key] = (string) $value;
            } elseif ($value instanceof UTCDateTime) {
                $result[$key] = $value->toDateTime()->format('c');
            } elseif ($value instanceof \MongoDB\Model\BSONDocument) {
                $result[$key] = self::docToArray($value);
            } elseif (is_array($value)) {
                $result[$key] = array_map(fn($item) => $item instanceof \MongoDB\Model\BSONDocument ? self::docToArray($item) : $item, $value);
            } else {
                $result[$key] = $value;
            }
        }
        if (isset($array['_id']) && !isset($result['id'])) {
            $result['id'] = (string) $array['_id'];
        }
        return $result;
    }

    public static function getClient(): Client
    {
        self::getDb();
        return self::$client;
    }
}
