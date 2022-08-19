import { serve } from "https://deno.land/std@0.145.0/http/server.ts";

class StripStream extends TransformStream {
  constructor() {

    let parsedFirstChunk: boolean = false;
    super({
      transform(chunk, controller) {
        if (parsedFirstChunk == false) {
          // 41,  93, 125,  39, 10 == ")]}'\n"
          chunk[0] = 0;
          chunk[1] = 0;
          chunk[2] = 0;
          chunk[3] = 0;

          controller.enqueue(chunk);
          parsedFirstChunk = true;
        }
        else {
          controller.enqueue(chunk);
        }
      }
    })
  }
}


type Route = [URLPattern, RequestHandler];
type RequestHandler = (Request) => Response;


serve((req: Request) => {
  const url = req.url;
  console.log(url)
  let response: Response = new Response("<html>404</html>", { status: 404 });

  const routes: Array<Route> = [
    [
      new URLPattern({pathname: "/api/features"}),
      (request) => {
        console.log(request)
        const version = new URL(req.url).searchParams.get("version") || 100;
        const featuresResponse = fetch(`https://chromestatus.com/api/v0/features?milestone=${version}`);
        return featuresResponse.then(response => new Response(response.body.pipeThrough(new StripStream())));
      }
    ]
  ];

  for (const [pattern, handler] of routes) {
    if (pattern.test(url)) {
      response = handler(req);
      break;
    }
  }

  return response;
});
