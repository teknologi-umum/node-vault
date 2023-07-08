# Hashicorp Vault Client for Node.js

Third party client library to connect to [Hashicorp Vault](https://www.vaultproject.io/). This library aims
to mimic some of more proper Vault SDK like [official Go SDK](https://pkg.go.dev/github.com/hashicorp/vault/api).

Features implemented:

- Secrets Engine
  - [ ] K/V Version 1
  - [x] K/V Version 2
  - [ ] SSH
  - [x] TOTP
- Auth Method
  - [x] AppRole
  - [ ] AWS
  - [ ] Azure
  - [x] Github
  - [ ] JWT/OIDC
  - [ ] Kubernetes
  - [x] LDAP
  - [ ] TLS Certificates
  - [x] Tokens
  - [x] Username & Password

You can help extending the features by contributing to the repository.

## Example

```ts
import {VaultClient} from "@teknologi-umum/vault";

const client = new VaultClient({address: process.env.VAULT_ADDRESS ?? "http://localhost:8200/"});

const userPassAuth = client.userPassAuth("annedoe", "very strong password");
const vaultToken = await userPassAuth.login();

// Apply the acquired token against the original client class.
client.setToken(vaultToken);

// Create a KVv2 secret engine client using the "kv2" mount.
const kv = client.kvv2("kv2");

await kv.put("hello", {value: "world"});
const firstSecret = await kv.get("hello"); // firstSecret.data returns '{ value: "world" }'


await kv.patch("hello", {secondValue: "foobar"});

await kv.delete("hello");
```

## License

```
The MIT License (MIT)

Copyright (c) 2023 Teknologi Umum

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

See [LICENSE](./LICENSE)