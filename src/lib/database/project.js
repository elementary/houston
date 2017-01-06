/**
 * lib/database/project.js
 * Mongoose model and schema for projects
 *
 * @exports {Object} default - project database model
 * @exports {Object} schema - project database schema
 * @exports {Project} class - a class to create projects
 */

import db from './connection'
import Master from './master'
import releaseSchema from './release'

/**
 * Schema for a project
 * @typedef Project
 * @type {Object}
 *
 * @property {Object} name - holds all names associated with the project
 * @property {String} name.human - a human readable name for the project
 * @property {String} name.custom - a custom configured name for the project
 * @property {String} name.desktop - the name given by the developer used on the desktop
 * @property {String} name.domain - the RDNN generated name for the project
 *
 * @property {Object} repository - code hosting information for the project
 * @property {String} repository.url - URL for hosted code
 * @property {String} repository.tag - tag for main branch of code
 *
 * @property {String} type - the type of project
 *
 * @property {Error} error - any error that occured during project methods
 *
 * @property {Object} github - holds data about project relationship to GitHub
 * @property {Number} github.id - GitHub repository id
 * @property {String} github.name - GitHub repository name (owner/repo)
 * @property {String} github.owner - GitHub repository owner's username
 * @property {String} github.repo - GitHub repository name
 * @property {Number} github.installation - Installation ID
 * @property {Boolean} github.private - true if repository is private on GitHub
 * @property {ObjectId} github.user - reference to user who owns repository on GitHub
 *
 * @property {Object} stripe - payment information though Stripe
 * @property {Boolean} stripe.enable - true if we are currently allowing payments
 * @property {String} stripe.id - Stripe account ID
 * @property {String} stripe.access - Stripe access oauth2 code
 * @property {String} stripe.refresh - Stripe refresh oauth2 code
 * @property {String} stripe.public - Stripe public oauth2 code
 * @property {String} stripe.user - reference to user who setup Stripe on project
 *
 * @property {Release[]} releases - all releases the project has
 */
export const schema = new db.Schema({
  name: {
    custom: String,
    desktop: String,

    domain: {
      type: String,
      required: true,
      unique: true,
      index: true,
      validate: {
        validator: (s) => /(.+)\.(.+)\.(.+)/.test(s),
        message: '{VALUE} is not a valid reverse domain name notation'
      }
    }
  },

  repository: {
    url: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: (s) => /.*\.git/.test(s),
        message: '{VALUE} is not a valid git repository'
      }
    },

    tag: {
      type: String,
      default: 'master'
    }
  },

  type: {
    type: String,
    default: 'Application'
  },

  error: Object,

  github: {
    id: {
      type: Number,
      unique: true,
      index: true
    },

    owner: String,
    repo: String,
    installation: Number,
    private: {
      type: Boolean,
      default: false
    },

    user: {
      type: db.Schema.Types.ObjectId,
      ref: 'user'
    }
  },

  stripe: {
    enable: {
      type: Boolean,
      default: false
    },

    id: String,

    access: String,
    refresh: String,
    public: String,

    user: {
      type: db.Schema.Types.ObjectId,
      ref: 'user'
    }
  },

  releases: [releaseSchema]
})

/**
 * toJSON
 * Sets mongodb to turn out getters and virtuals when calling .toJSON()
 */
schema.set('toJSON', {
  getters: true,
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id
    delete ret['id']
    delete ret['error']
    delete ret['github']['installation']
    delete ret['stripe']['id']
    delete ret['stripe']['access']
    delete ret['stripe']['refresh']
  }
})

/**
 * name.human
 * Returns a normal project name to be used in interfaces to the user
 *
 * @returns {String} - a nice human readable name for the project
 */
schema.virtual('name.human').get(function () {
  if (this.name.custom != null) return this.name.custom
  if (this.name.desktop != null) return this.name.desktop
  return this.name.domain
})

/**
 * name.human
 * Sets a custom name for the project
 *
 * @param {String} n - new custom name for the project
 * @returns {Void}
 */
schema.virtual('name.human').set(function (n) {
  this.name.custom = n
})

/**
 * github.name
 * Returns a normal github name for repository in the form of (owner/repo)
 *
 * @returns {String} - github name for owner and repository
 */
schema.virtual('github.name').get(function () {
  return `${this.github.owner}/${this.github.repo}`
})

/**
 * Project
 * holds everything valuable to houston
 */
export class Project extends Master {

  /**
   * getSelfStatus
   * Returns the status of the Project without propagating downwards
   *
   * Possible values are:
   *   NEW - no releases exist for this Project
   *   DEFER - look to the latest release for status
   *   ERROR - something bad happened to the project
   *
   * @async
   * @returns {String} - the status of the Project
   */
  async getSelfStatus () {
    if (this.error != null) return 'ERROR'

    const release = await this.findRelease()
    if (release == null) return 'NEW'

    return 'DEFER'
  }

  /**
   * getStatus
   * Returns the status of the Project with propagating down to release if needed
   *
   * Possible values are:
   *   NEW - no releases exist for this Project
   *   STANDBY - release is waiting to be cycled
   *   QUEUE - cycle is waiting to be ran
   *   RUN - cycle is currently being ran though flightcheck
   *   REVIEW - cycle is awaiting human review
   *   FINISH - cycle has finished and package is currently in stable
   *   FAIL - cycle has failed testing or reviewing
   *   ERROR - something bad happened to the project
   *
   * @async
   * @returns {String} - the status of the Project
   */
  async getStatus () {
    const status = await this.getSelfStatus()
    if (status !== 'DEFER') return status

    const release = await this.findRelease()
    return release.getStatus()
  }

  /**
   * setStatus
   * Sets the status of the project by propagating down as needed
   *
   * @async
   * @param {String} status - wanted status of the project
   * @throws {Error} - if we are unable to set the status
   * @returns {Object} - mongoose update object
   */
  async setStatus (status) {
    const current = await this.getSelfStatus()
    if (current !== 'DEFER') {
      throw new Error('Unable to set status manually of Project')
    }

    const release = await this.findRelease()
    return release.setStatus(status)
  }

  /**
   * findRelease
   * Finds the latest release from the database
   * TODO: sort by semver version
   *
   * @async
   * @returns {Release} - the latest release for the project
   */
  async findRelease () {
    return this.releases[this.releases.length - 1]
  }

  /**
   * findCycle
   * Finds the latest cycle for the project
   *
   * @async
   * @returns {Cycle} - the latest cycle for the project. Includes release cycles
   */
  async findCycle () {
    return this.model('cycle')
    .findOne({ project: this._id })
    .sort({ 'created_at': -1 })
  }
}

export default db.model(Project, schema, 'project')
