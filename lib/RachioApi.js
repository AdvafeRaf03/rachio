'use strict';

const Api = require('./utils/ApiUtils');
const _ = require('lodash');
const moment = require('moment');

const filter = criteria => (!_.isFunction(criteria) && _.isEmpty(criteria) ?
  arr => arr :
  _.partialRight(_.filter, criteria));

const timeFilter = (startTime, endTime) => (startTime
  ? filter(f => f.localizedTimeStamp >= startTime && f.localizedTimeStamp < endTime)
  : filter());

const defaults = {
  version: 1,
  units: 'US',
};

class RachioApi {
  constructor(accessToken, opts = {}) {
    this.access_token = accessToken;
    this.opts = Object.assign({}, defaults, opts);
    this.uri = `https://api.rach.io/${this.opts.version}/public`;
    this._api = new Api({
      baseUri: this.uri,
      headers: {
        Authorization: `Bearer ${this.access_token}`,
      },
    });
  }

  getPersonInfo() {
    return this._api.get({ endpoint: '/person/info' });
  }
  getPerson(id) {
    return this._api.get({ endpoint: `/person/${id}` });
  }

  getDevice(id) {
    return this._api.get({ endpoint: `/device/${id}` });
  }

  getDeviceCurrentSchedule(id) {
    return this._api.get({ endpoint: `/device/${id}/current_schedule` });
  }

  getDeviceEvents(id, startTime, endTime, filters = {}) {
    return this._api.get({ endpoint: `/device/${id}/event`, qs: { startTime, endTime } })
      .then(filter(filters));
  }

  getDeviceCurrentConditions(id, units = this.opts.units) {
    return this._api.get({ endpoint: `/device/${id}/forecast`, qs: { units } })
      .then(({ current }) => current);
  }

  getDeviceForecast(id, startTime, endTime = moment(startTime).add(1, 'day').valueOf(), units = this.opts.units) {
    return this._api.get({ endpoint: `/device/${id}/forecast`, qs: { units } })
      .then(({ forecast }) => forecast)
      .then(timeFilter(startTime, endTime));
  }

  getDeviceForecastToday(id, units = this.opts.units) {
    return this.getDeviceForecast(id, moment().startOf('day').valueOf(), moment().endOf('day').valueOf(), units)
      .then(([todayForecast]) => todayForecast);
  }

  getDevices() {
    return this.getPersonInfo()
      .then(({ id }) => this.getPerson(id))
      .then(({ devices }) => devices);
  }

  getZonesByDevice(deviceId) {
    return this.getDevice(deviceId)
      .then(({ zones }) => zones);
  }

  getWebhookTypes() {
    return this._api.get({ endpoint: '/notification/webhook_event_type' });
  }

  getWebhooksByDevice(deviceId) {
    return this._api.get({ endpoint: `/notification/${deviceId}/webhook` });
  }

  getWebhook(webhookId) {
    return this._api.get({ endpoint: `/notification/webhook/${webhookId}` });
  }
}

module.exports = RachioApi;