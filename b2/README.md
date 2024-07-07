# Cloudflare Worker for Backblaze B2 Integration

This project enables secure access to private [Backblaze B2](https://www.backblaze.com/b2/cloud-storage.html) buckets through a [Cloudflare Worker](https://developers.cloudflare.com/workers/). It ensures that objects stored in B2 buckets can be publicly accessed only via Cloudflare, adding an extra layer of security and control.

This repository is a fork of [backblaze-b2-samples/cloudflare-b2](https://github.com/backblaze-b2-samples/cloudflare-b2), tailored for enhanced functionality and security.

## Configuration

To set up your Cloudflare Worker for Backblaze B2 access, follow these steps:

1. **Set the Backblaze Application Key**: Securely store your B2 application key in the Cloudflare Worker environment by running:
   ```sh
   echo "<your b2 application key>" | wrangler secret put B2_APPLICATION_KEY
   ```
2. **Configure Environment Variables**: Modify the wrangler.toml file to include any additional environment variables required for your setup.

   - B2_APPLICATION_KEY_ID
   - B2_ENDPOINT
   - BUCKET_NAME
   - ALLOW_LIST_BUCKET

3. **[Optinal] Set Custom Domain**: If you want to use a custom domain for your Cloudflare Worker, update the `wrangler.toml` file with your domain name.
   ```toml
   routes = [{ "pattern" = "https://<your-domain>.com/*", "script" = "worker" }]
   ```

## Building and Deployment

To build and deploy your Cloudflare Worker, use the following commands:

```sh
# Install dependencies
yarn install

# Test locally
wrangler dev

# Deploy to Cloudflare
wrangler deploy
```

## Usage

Once deployed, access the content of any bucket through your worker's URL in the following format: https://<worker>.workers.dev/<bucket>/<path>. The worker authenticates the request using the stored B2 application key, granting access to the content if the key has the necessary permissions. If the requested object exists and the application key permits access to the private bucket, the content is served. Otherwise, a 404 error is returned.

This setup ensures that your Backblaze B2 bucket content is securely accessible, leveraging Cloudflare's global network for performance and security.
