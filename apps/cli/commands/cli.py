
from pathlib import Path

import click
from .graphdb_utils import get_graphdb_config, upload_ttl_to_graphdb, clear_graphdb, extract_graphdb
from api.services.bundle_export_service import ALL_LEGAL_TECHNOLOGIES_PATH
from api.services.graphdb_service import (
    export_named_graph_download,
    sync_named_graph_exports,
    migrate_legal_technology_blank_nodes,
)

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


@cli.command('download-named-graph')
@click.option('--out', default=None, help='Bestand om de volledige named graph in op te slaan (TTL).')
def download_named_graph(out):
    """Download de volledige named graph naar een Turtle-bestand."""
    output_path = Path(out) if out else ALL_LEGAL_TECHNOLOGIES_PATH
    try:
        turtle = export_named_graph_download()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(turtle, encoding='utf-8')
        click.echo(f'Named graph opgeslagen naar {output_path}')
    except Exception as e:
        click.echo(str(e))


@cli.command('sync-exports')
def sync_exports():
    """Werk alle lokale exportbestanden bij vanuit de named graph."""
    try:
        result = sync_named_graph_exports()
        click.echo(
            'Exports gesynchroniseerd: '
            f"{result['legal_technology_bundles']} legal technology bundles, "
            f"{result['organisation_bundles']} organisatiebundles, "
            f"named graph: {result['named_graph_path']}"
        )
    except Exception as e:
        click.echo(str(e))


@cli.command('migrate-blanknodes')
@click.option('--no-sync', is_flag=True, help='Sla het herschrijven van lokale exports over.')
def migrate_blanknodes(no_sync):
    """Migreer legacy IRI-child nodes naar blank nodes voor SHACL nodeKind-conforme ABox."""
    try:
        result = migrate_legal_technology_blank_nodes(sync_exports=not no_sync)
        migrated = result.get('migrated', {})
        click.echo(
            'Migratie voltooid: '
            f"documentatie={migrated.get('documentatie', 0)}, "
            f"ondersteuningVoor={migrated.get('ondersteuningVoor', 0)}, "
            f"versiebeschrijving={migrated.get('versiebeschrijving', 0)}"
        )
        if result.get('sync_exports') and result.get('exports'):
            exports = result['exports']
            click.echo(
                'Exports gesynchroniseerd: '
                f"{exports['legal_technology_bundles']} legal technology bundles, "
                f"{exports['organisation_bundles']} organisatiebundles, "
                f"named graph: {exports['named_graph_path']}"
            )
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
