<?php

namespace App\Helpers;

class Validator
{
    private array $errors = [];

    public function required(array $data, array $fields): self
    {
        foreach ($fields as $field) {
            if (empty($data[$field]) && $data[$field] !== '0' && $data[$field] !== 0) {
                $this->errors[$field][] = "{$field} is required";
            }
        }
        return $this;
    }

    public function email(array $data, string $field): self
    {
        if (!empty($data[$field]) && !filter_var($data[$field], FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field][] = "{$field} must be a valid email";
        }
        return $this;
    }

    public function minLength(array $data, string $field, int $min): self
    {
        if (!empty($data[$field]) && strlen($data[$field]) < $min) {
            $this->errors[$field][] = "{$field} must be at least {$min} characters";
        }
        return $this;
    }

    public function maxLength(array $data, string $field, int $max): self
    {
        if (!empty($data[$field]) && strlen($data[$field]) > $max) {
            $this->errors[$field][] = "{$field} must not exceed {$max} characters";
        }
        return $this;
    }

    public function inArray(array $data, string $field, array $allowed): self
    {
        if (!empty($data[$field]) && !in_array($data[$field], $allowed)) {
            $this->errors[$field][] = "{$field} must be one of: " . implode(', ', $allowed);
        }
        return $this;
    }

    public function numeric(array $data, string $field): self
    {
        if (!empty($data[$field]) && !is_numeric($data[$field])) {
            $this->errors[$field][] = "{$field} must be a number";
        }
        return $this;
    }

    public function passes(): bool
    {
        return empty($this->errors);
    }

    public function errors(): array
    {
        return $this->errors;
    }

    public static function make(array $data, array $rules): array
    {
        $validator = new self();
        foreach ($rules as $field => $ruleSet) {
            $ruleList = is_array($ruleSet) ? $ruleSet : explode('|', $ruleSet);
            foreach ($ruleList as $rule) {
                if ($rule === 'required') {
                    $validator->required($data, [$field]);
                } elseif (str_starts_with($rule, 'min:')) {
                    $validator->minLength($data, $field, (int) substr($rule, 4));
                } elseif (str_starts_with($rule, 'max:')) {
                    $validator->maxLength($data, $field, (int) substr($rule, 4));
                } elseif ($rule === 'email') {
                    $validator->email($data, $field);
                } elseif ($rule === 'numeric') {
                    $validator->numeric($data, $field);
                } elseif (str_starts_with($rule, 'in:')) {
                    $validator->inArray($data, $field, explode(',', substr($rule, 3)));
                }
            }
        }
        return ['passes' => $validator->passes(), 'errors' => $validator->errors()];
    }
}
