
import click
from .graphdb_utils import get_graphdb_config, upload_ttl_to_graphdb, clear_graphdb, extract_graphdb

@click.group()
def cli():
    """CLI voor beheer van juridische technologie ontologie in GraphDB."""
    pass

@cli.command()
@click.option('--file', required=True, help='Pad naar het ontologie-bestand (TTL).')
@click.option('--graph-uri', required=False, help='URI van de named graph waarin te importeren.')
def load(file, graph_uri):
    """Laad een ontologie in GraphDB (optioneel in een named graph)."""
    host, repo = get_graphdb_config()
    try:
        upload_ttl_to_graphdb(file, host, repo, graph_uri)
        if graph_uri:
            click.echo(f"Succesvol geladen: {file} in named graph {graph_uri} van repository {repo} op {host}")
        else:
            click.echo(f"Succesvol geladen: {file} in GraphDB repository {repo} op {host}")
    except Exception as e:
        click.echo(str(e))

@cli.command()
@click.option('--out', default='export.ttl', help='Bestand om naar te exporteren (TTL).')
def extract(out):
    """Exporteer data uit GraphDB."""
    host, repo = get_graphdb_config()
    try:
        extract_graphdb(host, repo, out)
        click.echo(f"Succesvol geëxporteerd naar {out} uit GraphDB repository {repo} op {host}")
    except Exception as e:
        click.echo(str(e))

@cli.command()
@click.confirmation_option(prompt='Weet je zeker dat je de graph wilt leegmaken?')
def clear():
    """Maak een graph in GraphDB leeg (met bevestiging)."""
    host, repo = get_graphdb_config()
    try:
        clear_graphdb(host, repo)
        click.echo(f"GraphDB repository {repo} op {host} is geleegd.")
    except Exception as e:
        click.echo(str(e))

if __name__ == '__main__':
    cli()
