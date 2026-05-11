<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);
        $middleware->validateCsrfTokens(except: ['api/ai-chat', 'api/ai-chat/*']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'admin' => \App\Http\Middleware\IsAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->respond(function (\Symfony\Component\HttpFoundation\Response $response, \Throwable $exception, \Illuminate\Http\Request $request) {
            $status = $response->getStatusCode();
            
            if (! app()->environment(['local', 'testing']) && in_array($status, [500, 503, 404, 403])) {
                return inertia('errors/error', [
                    'status' => $status,
                    'message' => $exception instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface ? $exception->getMessage() : null
                ])
                    ->toResponse($request)
                    ->setStatusCode($status);
            } elseif (in_array($status, [404, 403])) {
                return inertia('errors/error', [
                    'status' => $status,
                    'message' => $exception->getMessage() ?: null
                ])
                    ->toResponse($request)
                    ->setStatusCode($status);
            }
            return $response;
        });
    })->create();
