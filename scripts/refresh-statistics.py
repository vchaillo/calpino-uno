"""Create a compact statistics snapshot from the latest public F1DB release."""
import datetime
import io
import gzip
import json
from pathlib import Path
import urllib.request
import zipfile
from refresh_circuits import generate_circuits

ROOT = Path(__file__).resolve().parents[1]

def download(url):
    request = urllib.request.Request(url, headers={"User-Agent": "CalpinoUno/1.1 (github.com/vchaillo/calpino-uno)"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def generate(release, archive, svg_archive=None):
    def read(name):
        return json.loads(archive.read(f"f1db-{name}.json"))
    countries = {row['id']: row for row in read('countries')}
    seasons = read('seasons-drivers')
    results = read('races-race-results')
    completed_ids = {row['raceId'] for row in results}
    completed = [race for race in read('races') if race['id'] in completed_ids]
    last_race = max(completed, key=lambda race: race['date'])
    metrics = ['totalChampionshipWins', 'totalRaceStarts', 'totalRaceWins', 'totalPodiums', 'totalPolePositions', 'totalFastestLaps', 'totalSprintRaceWins', 'totalSprintRaceStarts', 'totalRaceLaps', 'totalGrandSlams', 'totalPoints']
    constructors = {row['id']: row for row in read('constructors')}
    season_teams = {}
    for result in sorted(results, key=lambda row: (row['year'], row['round'])):
        constructor = constructors[result['constructorId']]
        season_teams[(result['driverId'], result['year'])] = {'id': constructor['id'], 'name': constructor['name']}
    drivers = []
    for driver in read('drivers'):
        country = countries[driver['nationalityCountryId']]
        rows = [row for row in seasons if row['driverId'] == driver['id']]
        drivers.append({
            'id': driver['id'], 'name': driver['name'], 'firstName': driver['firstName'], 'lastName': driver['lastName'],
            'country': country['name'], 'countryCode': country['alpha2Code'], 'birthDate': driver['dateOfBirth'],
            'bestChampionshipPosition': driver['bestChampionshipPosition'],
            'team': season_teams.get((driver['id'], max((row['year'] for row in rows), default=0))),
            **{key: driver.get(key) for key in metrics},
            'seasons': [{ 'year': row['year'], 'position': row['positionNumber'], 'team': season_teams.get((driver['id'], row['year'])), **{key: row.get(key) for key in metrics if key != 'totalChampionshipWins'} } for row in rows]
        })
    final_standings = read('seasons-driver-standings')
    race_standings = read('races-driver-standings')
    race_index = {row['id']: row for row in read('races')}
    grand_prix = {row['id']: row for row in read('grands-prix')}
    champions = []
    for winner in final_standings:
        # championshipWon is an explicit source field, not an inferred clinching date.
        if not winner.get('championshipWon') or winner['positionNumber'] != 1:
            continue
        year = winner['year']
        runner_up = next((row for row in final_standings if row['year'] == year and row['positionNumber'] == 2), None)
        season = next(row for row in seasons if row['year'] == year and row['driverId'] == winner['driverId'])
        clinched = sorted((row for row in race_standings if row['year'] == year and row['driverId'] == winner['driverId'] and row.get('championshipWon')), key=lambda row: row['round'])
        race = race_index.get(clinched[0]['raceId']) if clinched else None
        champions.append({'year': year, 'driverId': winner['driverId'], 'points': winner['points'],
            'margin': round(winner['points'] - runner_up['points'], 3) if runner_up else None,
            'wins': season['totalRaceWins'],
            'clincher': {'name': grand_prix[race['grandPrixId']]['fullName'], 'round': race['round'], 'date': race['date']} if race else None})
    team_seasons = read('seasons-constructors')
    team_records = []
    for constructor in constructors.values():
        rows = [row for row in team_seasons if row['constructorId'] == constructor['id']]
        if not rows:
            continue
        team_results = [row for row in results if row['constructorId'] == constructor['id']]
        driver_ids = sorted({row['driverId'] for row in team_results})
        driver_records = []
        for identifier in driver_ids:
            driver = next(driver for driver in drivers if driver['id'] == identifier)
            entries = [row for row in team_results if row['driverId'] == identifier]
            driver_records.append({'id': identifier, 'name': driver['name'], 'countryCode':driver['countryCode'], 'races':len({row['raceId'] for row in entries}), 'wins':sum(row['positionNumber'] == 1 for row in entries)})
        country = countries[constructor['countryId']]
        team_records.append({'id':constructor['id'], 'name':constructor['name'], 'fullName':constructor['fullName'], 'country':country['name'], 'countryCode':country['alpha2Code'],
            'firstYear':min(row['year'] for row in rows), 'lastYear':max(row['year'] for row in rows), 'drivers':driver_records,
            'totalChampionshipWins':constructor['totalChampionshipWins'], **{key:constructor.get(key) for key in metrics if key != 'totalChampionshipWins'},
            'seasons':[{'year':row['year'], 'position':row['positionNumber'], **{key:row.get(key) for key in metrics if key != 'totalChampionshipWins'}} for row in rows]})
    # Derive additional records from race results, retaining shared-car attribution.
    ordered_races=sorted(completed,key=lambda row:(row['year'],row['round']))
    from collections import defaultdict
    by_driver=defaultdict(list)
    for result in results: by_driver[result['driverId']].append(result)
    for driver in drivers:
        entries=by_driver[driver['id']]
        def extras(rows):
            # A driver can share multiple cars in an early GP; count the best finish once.
            unique={}
            for row in rows:
                previous=unique.get(row['raceId'])
                if previous is None or (row['positionNumber'] or 999)<(previous['positionNumber'] or 999):unique[row['raceId']]=row
            rows=list(unique.values())
            wins=[row for row in rows if row['positionNumber']==1]
            years={row['year'] for row in rows}
            return {'totalSecondPlaces':sum(row['positionNumber']==2 for row in rows),'totalThirdPlaces':sum(row['positionNumber']==3 for row in rows),
                'totalHatTricks':sum(bool(row['positionNumber']==1 and row['polePosition'] and row['fastestLap']) for row in rows),
                'winningCircuits':len({race_index[row['raceId']]['circuitId'] for row in wins}),'winningConstructors':len({row['constructorId'] for row in wins}),
                'winningSeasons':len({row['year'] for row in wins}),'bestSeasonWins':max((sum(row['year']==year for row in wins) for year in years),default=0),'totalSeasons':len(years)}
        driver.update(extras(entries))
        win_ids={row['raceId'] for row in entries if row['positionNumber']==1}
        streak=best=0
        for race in ordered_races:
            streak=streak+1 if race['id'] in win_ids else 0
            best=max(best,streak)
        driver['longestWinStreak']=best
        for season in driver['seasons']:
            rows=[row for row in entries if row['year']==season['year']]
            season.update(extras(rows))
            streak=best=0
            for race in ordered_races:
                if race['year']!=season['year']:continue
                streak=streak+1 if race['id'] in win_ids else 0
                best=max(best,streak)
            season['longestWinStreak']=best
    additional={}
    for key,table,season_table,identifier in [('engines','engine-manufacturers','seasons-engine-manufacturers','engineManufacturerId'),('tyres','tyre-manufacturers','seasons-tyre-manufacturers','tyreManufacturerId')]:
        rows=read(season_table)
        additional[key]=[{**row,'country':countries[row['countryId']]['name'],'countryCode':countries[row['countryId']]['alpha2Code'], 'seasons':[{**season,'position':season.get('positionNumber')} for season in rows if season[identifier]==row['id']]} for row in read(table)]
    snapshot = {'source': 'F1DB', 'license': 'CC BY 4.0', 'version': release['tag_name'], 'publishedAt': release['published_at'], 'generatedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'through': last_race['date'], 'drivers': drivers, 'champions': champions, 'teams':team_records, **additional}
    assert len(drivers) > 800, 'Incomplete driver directory'
    hamilton = next(row for row in drivers if row['id'] == 'lewis-hamilton')
    assert hamilton['totalChampionshipWins'] == 7 and hamilton['totalRaceWins'] >= 105
    assert all(row['totalRaceWins'] <= row['totalRaceStarts'] for row in drivers)
    destination = ROOT / 'data' / 'statistics.json.gz'
    destination.parent.mkdir(exist_ok=True)
    destination.write_bytes(gzip.compress(json.dumps(snapshot, ensure_ascii=False, separators=(',', ':')).encode(), mtime=0))
    (ROOT/'data'/'statistics-meta.json').write_text(json.dumps({key:snapshot[key] for key in ['version','through','generatedAt']}))
    if svg_archive is None:
        svg_archive = zipfile.ZipFile(io.BytesIO(download("https://codeload.github.com/f1db/f1-circuits-svg/zip/refs/heads/main")))
    generate_circuits(ROOT, read, svg_archive, release, last_race["date"])
    print(f"Statistics: {len(drivers)} drivers, {release['tag_name']}, through {last_race['date']}")

if __name__ == '__main__':
    release = json.loads(download('https://api.github.com/repos/f1db/f1db/releases/latest'))
    asset = next(asset for asset in release['assets'] if asset['name'] == 'f1db-json-splitted.zip')
    generate(release, zipfile.ZipFile(io.BytesIO(download(asset['browser_download_url']))))
