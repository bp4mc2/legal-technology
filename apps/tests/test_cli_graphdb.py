import pytest
from click.testing import CliRunner
from cli.commands.cli import cli
import os

@pytest.mark.skipif(os.environ.get('GRAPHDB_TESTS') != '1', reason='GraphDB niet beschikbaar voor integratietest')
def test_cli_load_graphdb(tmp_path):
    # Vereist een draaiende GraphDB instance
    testfile = tmp_path / 'test.ttl'
    testfile.write_text('@prefix ex: <http://example.org/> . ex:a ex:b ex:c .')
    runner = CliRunner()
    result = runner.invoke(cli, ['load', '--file', str(testfile)])
    assert result.exit_code == 0
    assert 'Succesvol geladen' in result.output

@pytest.mark.skipif(os.environ.get('GRAPHDB_TESTS') != '1', reason='GraphDB niet beschikbaar voor integratietest')
def test_cli_extract_graphdb(tmp_path):
    runner = CliRunner()
    outfile = tmp_path / 'export.ttl'
    result = runner.invoke(cli, ['extract', '--out', str(outfile)])
    assert result.exit_code == 0
    assert 'Succesvol geëxporteerd' in result.output
    assert outfile.exists()

@pytest.mark.skipif(os.environ.get('GRAPHDB_TESTS') != '1', reason='GraphDB niet beschikbaar voor integratietest')
def test_cli_clear_graphdb():
    runner = CliRunner()
    result = runner.invoke(cli, ['clear'], input='y\n')
    assert result.exit_code == 0
    assert 'is geleegd' in result.output
