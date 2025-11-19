import { _decorator, Component, Node } from 'cc';
import { EventManager } from '../Managers/EventManager';
import { GameEvent } from '../enums/GameEvent';

import { GameResult } from '../enums/GameResult';
import { GameLogEntry } from '../Log/GameLogEntry';

import { GenericPopup } from '../Popup/GenericPopup';
import { PopupButtonData } from '../Popup/PopupButtonData';
import { PopupPage } from '../Popup/PopupPage';

import { AnimationType } from '../enums/AnimationType';
import { Player } from '../Player';
import { Dealer } from '../Dealer';


const { ccclass, property } = _decorator;

const LINE_PER_PAGE = 6;

@ccclass('LogManager')
export class LogManager extends Component {
    private gameHistory: GameLogEntry[] = [];

    @property(GenericPopup)
    private historyPopup: GenericPopup = null!;

    private currentLogEntry: GameLogEntry;

    start() {
        EventManager.instance.gameEvents.on(GameEvent.BET_PLACED, this.setBetLog, this);
        EventManager.instance.gameEvents.on(GameEvent.GAME_ENDED, this.setGameResultLog, this);
    }
        
    private setBetLog(currentBet: number) {
        this.currentLogEntry = new GameLogEntry();
        this.currentLogEntry.content = 'Bet: $' + (-currentBet);
        this.gameHistory.push(this.currentLogEntry);
    }

    private setCardDealLog() {

    }

    private setGameResultLog(gameResults: GameResult[], playerHands: Player[], dealerHand: Dealer) {
        this.currentLogEntry = new GameLogEntry();
        this.currentLogEntry.content = "Game Finished\n";
        this.currentLogEntry.content += "Dealer's Hand: " + dealerHand.handToString()  + " (" + dealerHand.getHandValue() + ")\n";
        this.currentLogEntry.content += "Player's Hand: ";
        let playerHandStr = [];
        playerHands.forEach(playerHand => {
            playerHandStr.push(playerHand.handToString() + " (" + playerHand.getHandValue() + ") : " + this.getResultStr(gameResults[playerHand.getIndex()]));
        })
        if (playerHandStr.length > 1) {
            this.currentLogEntry.content += "\n" + playerHandStr.join("\n");
        } else {
            this.currentLogEntry.content += playerHandStr[0];
        }
        this.gameHistory.push(this.currentLogEntry);
    }

    public displayHistoryPopup() {
        let popupBtns = [];
        popupBtns.push(new PopupButtonData('Close'));

        let tmpLogLines = [];
        this.gameHistory.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        this.gameHistory.forEach(log => {
            tmpLogLines.push("[" + log.getTimeStamp() + "]\t" + log.getContent());
        });

        //Break log up into separate lines
        let allLogLines = [];
        tmpLogLines.forEach(logLines => {
            allLogLines = allLogLines.concat(logLines.split("\n"));
        });

        // let paginatedLogs = this.paginateLogs(allLogLines);
        let paginatedLogs = this.paginateLogs(allLogLines);

        let popupPages = [];
        for(let pageNum = 0; pageNum < paginatedLogs.length; pageNum++) {
            let pageContent = "";
            let pageLogs = paginatedLogs[pageNum];
            pageContent += pageLogs.join("\n");
            popupPages.push(new PopupPage(pageNum, pageContent));
        }
        // Fade for the popup mask, FlyTop for the popup
        let entryAnims = [AnimationType.Fade, AnimationType.FlyTop];
        let exitAnims = [AnimationType.Fade, AnimationType.FlyTop];

        this.historyPopup.show('History', popupPages, popupBtns, entryAnims, exitAnims);
    }

    private paginateLogs(logs: string[]): string[][] {
        const pages: string[][] = [];
        let currentPage: string[] = [];
        let currentLineCount = 0;

        for (const log of logs) {
            const logLines = log.split("\n").length;

            if (currentLineCount + logLines > LINE_PER_PAGE) {
                // Start new page
                pages.push(currentPage);
                currentPage = [];
                currentLineCount = 0;
            }

            currentPage.push(log);
            currentLineCount += logLines;
        }

        // Push last page if not empty
        if (currentPage.length > 0) {
            pages.push(currentPage);
        }

        return pages;
    }

    private getResultStr(gameResult: GameResult): string {
        switch (gameResult) {
            case GameResult.Win:
                return "Won";

            case GameResult.Lose:
                return "Lost";

            case GameResult.WinBlackJack:
                return "Won with BlackJack";

            case GameResult.Draw:
                return "Pushed";
        }
        return "";
    }

    onDestroy() {
        EventManager.instance.gameEvents.off(GameEvent.BET_PLACED, this.setBetLog, this);
        EventManager.instance.gameEvents.off(GameEvent.GAME_ENDED, this.setGameResultLog, this);
    }
}