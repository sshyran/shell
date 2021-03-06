import test from 'tappedout'
import { Shell } from '@author.io/shell'

test('Common flags (entire shell)', t => {
  const shell = new Shell({
    name: 'account',
    commonflags: {
      typical: {
        alias: 't',
        description: 'A typical flag on all commands.',
        default: true
      }
    },
    commands: [{
      name: 'create',
      handler (meta) {
        t.ok(meta.flag('typical'), `Retrieved common flag value. Expected true, received ${meta.flag('typical')}`)
      }
    }]
  })

  shell.exec('create')
    .catch(e => t.fail(e.message))
    .finally(() => t.end())
})

test('Common flags (command-specific)', t => {
  const shell = new Shell({
    name: 'account',
    commonflags: {
      typical: {
        alias: 't',
        description: 'A typical flag on all commands.',
        default: true
      }
    },
    commands: [{
      name: 'create',
      handler (meta) {
        t.ok(meta.flag('typical'), `Retrieved common flag value. Expected true, received ${meta.flag('typical')}`)
      },
      commands: [{
        name: 'noop',
        handler (meta) {
          t.ok(
            meta.flags.recognized.hasOwnProperty('typical') &&
            !meta.flags.recognized.hasOwnProperty('org')
            , 'Recognized global flag but not those of other commands.'
          )
        }
      }, {
        name: 'account',
        commonflags: {
          org: {
            alias: 'o',
            description: 'Indicates the account is for an org.',
            type: Boolean,
            default: false
          }
        },
        commands: [{
          name: 'test',
          flags: {
            any: {
              alias: 'a',
              description: 'a'
            }
          },
          handler (meta) {
            t.ok(
              meta.flags.recognized.hasOwnProperty('typical') &&
              meta.flags.recognized.hasOwnProperty('org') &&
              meta.flags.recognized.hasOwnProperty('any'),
              'Expected 3 flags (inherited)'
            )
          }
        }]
      }]
    }]
  })

  shell.exec('create account test')
    .then(r => {
      shell.exec('create noop')
        .catch(e => console.log(e.stack) && t.fail(e.message))
        .finally(() => t.end())
    })
    .catch(e => console.log(e.stack) && t.fail(e.message) && t.end())
})

test('Common flags (exclusions)', async t => {
  const shell = new Shell({
    name: 'account',
    commonflags: {
      ignore: ['other'],
      typical: {
        alias: 't',
        description: 'A typical flag on all commands.',
        default: true
      }
    },
    commands: [{
      name: 'create',
      handler (meta) {
        t.ok(meta.flag('typical'), `Retrieved common flag value. Expected true, received ${meta.flag('typical')}`)
      }
    }, {
      name: 'delete',
      handler (meta) {
        t.ok(meta.flag('typical'), `Retrieved common flag value. Expected true, received ${meta.flag('typical')}`)
      }
    }, {
      name: 'other',
      handler (meta) {
        t.ok(!meta.flags.recognized.hasOwnProperty('typical'), 'The common flag "typical" was successfully excluded.')
      },
      commands: [{
        name: 'sub',
        handler (meta) {
          t.ok(!meta.flags.recognized.hasOwnProperty('typical'), 'The common flag "typical" was successfully excluded from a sub command.')
        },
        commands: [{
          name: 'cmd',
          handler (meta) {
            t.ok(!meta.flags.recognized.hasOwnProperty('typical'), 'The common flag "typical" was successfully excluded from a nested sub command.')
          }
        }]
      }]
    }]
  })

  await shell.exec('create').catch(t.fail)
  await shell.exec('delete').catch(t.fail)
  await shell.exec('other').catch(t.fail)
  await shell.exec('other sub').catch(t.fail)
  await shell.exec('other sub cmd').catch(t.fail)
  t.end()
})
