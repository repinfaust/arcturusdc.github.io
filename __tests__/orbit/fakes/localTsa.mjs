// A throwaway RFC 3161 time-stamp authority built with openssl, for tests only (D-SITE-063).
// Nothing leaves the machine. `org` names the TSA's organisation, so vendor pinning can be tested.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const run = (cwd, ...a) => execFileSync('openssl', a, { cwd, stdio: ['pipe', 'pipe', 'ignore'] });

export function localTsa({ org = 'DigiCert Test', policy = '1.2.3.4.1' } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'orbit-tsa-'));
  writeFileSync(join(dir, 'tsa.cnf'), `[ tsa ]
default_tsa = tsa_config
[ tsa_config ]
dir = .
serial = ./tsaserial
crypto_device = builtin
signer_cert = ./tsa.pem
certs = ./ca.pem
signer_key = ./tsa.key
signer_digest = sha256
default_policy = ${policy}
other_policies = ${policy}
digests = sha256
accuracy = secs:1
ordering = no
tsa_name = yes
ess_cert_id_chain = no
ess_cert_id_alg = sha256
[ v3_tsa ]
basicConstraints = critical,CA:FALSE
keyUsage = critical,digitalSignature
extendedKeyUsage = critical,timeStamping
`);
  writeFileSync(join(dir, 'tsaserial'), '01\n');
  run(dir, 'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'ca.key', '-out', 'ca.pem', '-days', '2', '-subj', `/O=${org}/CN=${org} Root`, '-addext', 'basicConstraints=critical,CA:TRUE', '-addext', 'keyUsage=critical,keyCertSign');
  run(dir, 'req', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'tsa.key', '-out', 'tsa.csr', '-subj', `/O=${org}/CN=${org} Timestamp`);
  run(dir, 'x509', '-req', '-in', 'tsa.csr', '-CA', 'ca.pem', '-CAkey', 'ca.key', '-CAcreateserial', '-out', 'tsa.pem', '-days', '2', '-extfile', 'tsa.cnf', '-extensions', 'v3_tsa');
  return {
    caFile: join(dir, 'ca.pem'),
    // Stands in for the HTTP POST: takes the DER query, returns the DER reply.
    post: async (queryDer) => {
      writeFileSync(join(dir, 'q.tsq'), queryDer);
      run(dir, 'ts', '-reply', '-config', 'tsa.cnf', '-queryfile', 'q.tsq', '-out', 'r.tsr');
      return readFileSync(join(dir, 'r.tsr'));
    },
  };
}
