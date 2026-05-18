
import sys
import os
import pytest
from click.testing import CliRunner
from pathlib import Path

# Voeg projectroot toe aan sys.path zodat cli.commands gevonden wordt
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from cli.commands.cli import cli
import cli.commands.cli as cli_module


@pytest.fixture(autouse=True)
def patch_cli_graphdb(monkeypatch):
    monkeypatch.setattr(cli_module, 'upload_ttl_to_graphdb', lambda *args, **kwargs: True)
    monkeypatch.setattr(cli_module, 'extract_graphdb', lambda *args, **kwargs: True)
    monkeypatch.setattr(cli_module, 'clear_graphdb', lambda *args, **kwargs: True)
    monkeypatch.setattr(cli_module, 'get_graphdb_config', lambda: ('http://localhost:7200', 'legal_technologies'))

def test_cli_load(monkeypatch):
    runner = CliRunner()
    result = runner.invoke(cli, ['load', '--file', 'ontology/legal technology.ttl'])
    assert result.exit_code == 0
    assert 'Succesvol geladen: ontology/legal technology.ttl' in result.output

def test_cli_extract(monkeypatch):
    runner = CliRunner()
    result = runner.invoke(cli, ['extract'])
    assert result.exit_code == 0
    assert 'Succesvol geëxporteerd naar export.ttl uit GraphDB repository' in result.output

def test_cli_clear(monkeypatch):
    runner = CliRunner()
    # Simuleer bevestiging met 'y' (yes)
    result = runner.invoke(cli, ['clear'], input='y\n')
    assert result.exit_code == 0
    assert 'GraphDB repository' in result.output


def test_cli_download_named_graph(tmp_path, monkeypatch):
    runner = CliRunner()
    out = tmp_path / 'all-legal-technologies.ttl'
    monkeypatch.setattr(cli_module, 'export_named_graph_download', lambda: '@prefix lto: <http://bp4mc2.org/lto#> .\n')

    result = runner.invoke(cli, ['download-named-graph', '--out', str(out)])

    assert result.exit_code == 0
    assert out.exists()
    assert out.read_text(encoding='utf-8').startswith('@prefix lto:')
    assert f'Named graph opgeslagen naar {out}' in result.output


def test_cli_sync_exports(monkeypatch):
    runner = CliRunner()
    monkeypatch.setattr(
        cli_module,
        'sync_named_graph_exports',
        lambda: {
            'legal_technology_bundles': 2,
            'organisation_bundles': 3,
            'named_graph_path': str(Path('data') / 'all-legal-technologies.ttl'),
        },
    )

    result = runner.invoke(cli, ['sync-exports'])

    assert result.exit_code == 0
    assert 'Exports gesynchroniseerd: 2 legal technology bundles, 3 organisatiebundles' in result.output
