import {
  httpClient,
  HttpMethod,
  HttpRequest,
  AuthenticationType, HttpError
} from '@activepieces/pieces-common';
import { createTrigger, OAuth2PropertyValue, TriggerStrategy } from '@activepieces/pieces-framework';
import axios from 'axios';
export const estimateStepUpdated = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'estimateStepUpdated',
    displayName: 'Estimate Step Updated',
    description: 'Triggers when the step of an estimate has been updated.',
    props: {},
    sampleData: {
      "date": "2025-03-05",
      "related": [
        {
          "type": "company",
          "id": 0
        }
      ],
      "contact_id": 0,
      "assigned_staff_id": 0,
      "status": "draft",
      "number": "EST-20210611-0010",
      "amounts": {
        "shipping": "128.54",
        "packaging": "40.24",
        "total_raw_excl_tax": "933.07",
        "total_after_discount_excl_tax": "821.10",
        "total_excl_tax": "843.10",
        "total": "898.97",
        "total_primes_incl_tax": "10.00"
      },
      "currency": "ss",
      "subject": "string",
      "public_link": "string",
      "public_link_enabled": true,
      "payment_method_ids": [
        0
      ],
      "decimal_number": {
        "unit_price": 0,
        "quantity": 0,
        "main": 0
      },
      "pdf_link": "http://example.com",
      "expiry_date": "2025-03-05",
      "payment_conditions_acceptance": {
        "enabled": true
      },
      "invoicing_address_id": 0,
      "delivery_address_id": 0,
      "note": "This estimate is very important<br />",
      "shipping_date": "2025-03-05",
      "bank_account_id": 1,
      "eco_tax_id": 0,
      "check_label_id": 0,
      "vat_mode": "debit",
      "vat_mention": "mention",
      "analytic_code": "divers",
      "id": 6657,
      "owner": {
        "type": "string",
        "id": 0
      },
      "created": "2025-03-05T14:05:56Z",
      "discount": {
        "percent": "12.00",
        "amount": "111.97",
        "type": "amount"
      },
      "fiscal_year_id": 0,
      "taxes": [
        {}
      ],
      "rate_category_id": 777,
      "service_dates": {
        "start": "2023-01-01",
        "end": "2023-01-31"
      },
      "shipping_weight": {
        "unit": "g",
        "value": 100.5
      },
      "company_reference": "string",
      "company_name": "string",
      "rows": [
        {}
      ],
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context){
      console.log('onEnable');
      const token = (context.auth as OAuth2PropertyValue).access_token;
      const events = ['estimate.step'];
      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `https://api.slsy.io/v2/webhooks`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token,
        },
        body: {
          configuration: events.map(event => ({ id: event, is_enabled: true })),
          endpoint: context.webhookUrl.replace('http://127.0.0.1:4200', 'https://e3ef-154-50-5-114.ngrok-free.app'),
          is_enabled: true,
          type: "http"
        }
      };

      try {
        const response = await httpClient.sendRequest(request);
        await context.store?.put<WebhookInformation>('_new_submission_trigger', {
          id: response.body.id,
        });
      } catch (e) {
        if ((e as HttpError).response.status !== 400) {
           throw e;
        }
        //webhook already exist
      }
    },
    async onDisable(context){
      const information = await context.store?.get<WebhookInformation>(
        '_new_submission_trigger'
      );

      if (information === null || information === undefined ) {
        return;
      }

      const token = (context.auth as OAuth2PropertyValue).access_token;
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `https://api.slsy.io/v2/webhooks/${information.id}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token,
        },
      };

      await httpClient.sendRequest(request);
    },
    async run(context){
      console.log('receive');
      const payload = context.payload.body as Record<string, string>;
      const notif = JSON.parse(payload['notif']);
      const token = (context.auth as OAuth2PropertyValue).access_token;

      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `https://api.slsy.io/v2/estimates/${notif.relatedid}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token,
        },
      };

      const response = await httpClient.sendRequest(request);
      const body = response.body;
      body.company = body.individual = null;
      body.opportunities = [];
      body.related.forEach((item: { type: string, id: string }) => {
        switch (item.type) {
          case 'company':
            body.company = item.id;
            break;
          case 'individual':
            body.individual = item.id;
            break;
          case 'opportunity':
            body.opportunities.push(item.id);
            break;
        }
      });

      return [body]
    }
})

interface WebhookInformation {
  id: string;
}
