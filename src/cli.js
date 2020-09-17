const fs = require('fs');
const commandLineUsage = require('command-line-usage');
const Vault = require('./vault').Vault;

const init = ({ path }) => {
  const vault = new Vault({ credentialsFilePath: path });
  if (fs.existsSync(`${vault.credentialsFilePath}.enc`)) {
    console.log('Warning credentials.json.enc exists, ensure decrypt file before generate new key');
  } else if (fs.existsSync(`${vault.credentialsFilePath}.key`)) {
    console.log('Warning credentials.json.key exists, delete credentials.json.key to generate new key');
  } else {
    const masterKey = vault.getMasterKey() || vault.createNewKey();
    fs.writeFileSync(`${vault.credentialsFilePath}.key`, masterKey);
    vault
      .encryptFile()
      .then(() => {
        fs.unlinkSync(`${vault.credentialsFilePath}`);
        try {
          fs.unlinkSync(`${vault.credentialsFilePath}.iv`);
        } catch {}
      })
      .catch((error) => console.error(error));
  }
};

const encrypt = ({ path }) => {
  const vault = new Vault({ credentialsFilePath: path });
  if (fs.existsSync(`${vault.credentialsFilePath}.key`) || process.env.NODE_MASTER_KEY) {
    vault
      .encryptFile()
      .then(() => {
        fs.unlinkSync(`${vault.credentialsFilePath}`);
        try {
          fs.unlinkSync(`${vault.credentialsFilePath}.iv`);
        } catch {}
      })
      .catch((error) => console.error(error));
  } else {
    console.log('Warning credentials.json.key not exists, create new key with init');
  }
};

const edit = ({ path }) => {
  const vault = new Vault({ credentialsFilePath: path });

  if (fs.existsSync(`${vault.credentialsFilePath}.enc`)) {
    decrypt({ path });
  } else if (fs.existsSync(`${vault.credentialsFilePath}`)) {
    encrypt({ path });
  }
};

const decrypt = ({ path }) => {
  const vault = new Vault({ credentialsFilePath: path });
  if (!fs.existsSync(`${vault.credentialsFilePath}.enc`)) {
    console.log('Error credentials.json.enc not exists');
  } else {
    vault.editCredentials();
    fs.unlinkSync(`${vault.credentialsFilePath}.enc`);
  }
};

const help = () => {
  const sections = [
    {
      header: 'node-vault',
      content: 'encrypted your credentials',
    },
    {
      header: 'Synopsis',
      content: 'node-vault <command> <options>',
    },
    {
      header: 'Command List',
      content: [
        { name: 'help', summary: 'help' },
        {
          name: 'init',
          summary: 'create credentials.json.key and encrypt your credentials.json',
        },
        { name: 'encrypt', summary: 'encrypt credentials.json' },
        { name: 'decrypt', summary: 'decrypt credentials.json.enc' },
        { name: 'edit', summary: 'decrypt/encrypt' },
      ],
    },
    {
      header: 'Options',
      content: [{ name: '-p, --path', summary: 'Path for credentials.json file' }],
    },
  ];
  const usage = commandLineUsage(sections);
  console.log(usage);
};

module.exports = {
  init,
  encrypt,
  edit,
  decrypt: edit,
  help,
};
