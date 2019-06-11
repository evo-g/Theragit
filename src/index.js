const {Command, flags} = require('@oclif/command');
const cli = require('cli-ux').default;
const axios = require('axios');
const chalk = require('chalk');

require('dotenv').config();

const getIssues = data => data.map(
  ({ name, description, issues_url, open_issues_count, html_url }) => 
    ({
      name,
      description,
      issues_url: issues_url.replace('{/number}', ''),
      open_issues_count,
      html_url
    })
).filter(({ open_issues_count }) => {
  return open_issues_count !== 0
});

const colorizeIssue = ({ open_issues_count: count }) => {
  switch(true) {
    case count !== 1 && count <= 4:
      return chalk.yellow(count)
    case count >= 5:
      return chalk.red(count)
    default:
      return count
  };
};

class CliEgCommand extends Command {
  async run() {
    const name = await cli.prompt('What is your github username?')

    cli.action.start('Looking up your issues')

    const githubData = await axios
      .get(`https://api.github.com/users/${name}/repos?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}`)
      .then(response => response.data)
      .catch(error => {
        if (error.response.status === 404) {
          this.error(chalk.red('No user found!'))
        } else {
          this.error(error)
        }
      })
    const normalizedData = getIssues(githubData);
    cli.action.stop();

    cli.table(normalizedData, {
      name: {
        minWidth: 15
      },
      open_issues_count: {
        header: 'Open Issues',
        get: colorizeIssue,
        minWidth: 13
      },
      description: {
        minWidth: 30
      },
      html_url: {
        minWidth: 20
      }
    }, {
      printLine: this.log,
      ...flags, // parsed flags
    })
  }
}

// test user with several = nelsonic

CliEgCommand.description = `Describe the command here
...
Look up open issues for any gitHub user
`

CliEgCommand.flags = {
  // add --version flag to show CLI version
  version: flags.version({char: 'v'}),
  // add --help flag to show CLI version
  help: flags.help({char: 'h'}),
  name: flags.string({char: 'n', description: 'name to print'}),
  ...cli.table.flags()
};

module.exports = CliEgCommand
