import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

export const updateOpportunityStatus = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'updateOpportunityStatus',
  displayName: 'Update Opportunity Status',
  description: 'Update opportunity status.',
  props: {
    oppId: Property.Number({
      displayName: 'Opportunity identifier',
      description: 'The opportunity identifier',
      required: true,
    }),
    fromStatus: Property.StaticMultiSelectDropdown({
      displayName: 'From status(es)',
      description: 'Current status of the opportunity',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Won', value: 'won' },
          { label: 'Lost', value: 'lost' },
          { label: 'Cancelled', value: 'cancelled' },
          { label: 'Closed', value: 'closed' },
          { label: 'Late', value: 'late' },
        ],
      },
    }),
    toStatus: Property.StaticDropdown({
      displayName: 'To status',
      description: 'Current status of the opportunity',
      required: true,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Won', value: 'won' },
          { label: 'Lost', value: 'lost' },
          { label: 'Cancelled', value: 'cancelled' },
          { label: 'Closed', value: 'closed' },
          { label: 'Late', value: 'late' },
        ],
      },
    })

},
  async run(context) {

    const id = context.propsValue.oppId;
    const from = context.propsValue.fromStatus;
    const to = context.propsValue.toStatus;


    const token = (context.auth as OAuth2PropertyValue).access_token;

    if (from !== undefined && from.length > 1) {
      const getRequest: HttpRequest = {
        method: HttpMethod.GET,
        url: `https://api.slsy.io/v2/opportunities/${id}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token,
        },
      };
      const getResponse = await httpClient.sendRequest(getRequest);

      if (!from.includes( getResponse.body['status']) || getResponse.body['status'] === to) {
        console.debug('Skip: from status not match')
        return;
      }
    }

    const request: HttpRequest = {
      method: HttpMethod.PUT,
      url: `https://api.slsy.io/v2/oppgortunities/${id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
      body: {
        status: to,
      },
    };

    const response = await httpClient.sendRequest(request);
    return response.body;
  },
});
