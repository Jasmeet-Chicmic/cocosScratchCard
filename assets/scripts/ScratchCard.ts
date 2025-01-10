
import { _decorator, Component, Node, Vec2, Rect, Mask, Label, Graphics, UITransform, Vec3, Color } from 'cc';
const { ccclass, property } = _decorator;
import { Intersection } from './Intersection';


@ccclass('ScratchCard')
export class ScratchCard extends Component {

    @property(Number)
    clearLineWidth: number = 15;

    @property(Number)
    calcRectWidth: number = 15;

    @property(Boolean)
    calcDebugger: boolean = false;

    @property(Node)
    maskNode !: Node;

    @property(Node)
    cardNode !: Node;

    @property(Label)
    progress !: Label;

    tempDrawPoints: Vec3[] = [];
    tempPos: Vec3 = new Vec3();
    polygonPointsList: { rect: Rect; isHit: boolean }[] = [];


    onLoad() {
        this.reset();
        this.cardNode.on(Node.EventType.TOUCH_START, this.touchStartEvent, this);
        this.cardNode.on(Node.EventType.TOUCH_MOVE, this.touchMoveEvent, this);
        this.cardNode.on(Node.EventType.TOUCH_END, this.touchEndEvent, this);
        this.cardNode.on(Node.EventType.TOUCH_CANCEL, this.touchEndEvent, this);
    }

    beforeDestroy() {
        this.cardNode.off(Node.EventType.TOUCH_START, this.touchStartEvent, this);
        this.cardNode.off(Node.EventType.TOUCH_MOVE, this.touchMoveEvent, this);
        this.cardNode.off(Node.EventType.TOUCH_END, this.touchEndEvent, this);
        this.cardNode.off(Node.EventType.TOUCH_CANCEL, this.touchEndEvent, this);
    }

    touchStartEvent(evt: any) {
        let cardNodeUITransform = this.cardNode.getComponent(UITransform)!;
        const localPos = evt.getUILocation();
        this.tempPos.set(localPos.x, localPos.y, 0);
        let point = cardNodeUITransform.convertToNodeSpaceAR(this.tempPos);
        this.clearMask(point);
    }

    touchMoveEvent(evt: any) {
        let cardNodeUITransform = this.cardNode.getComponent(UITransform)!;
        const localPos = evt.getUILocation();
        this.tempPos.set(localPos.x, localPos.y, 0);
        let point = cardNodeUITransform.convertToNodeSpaceAR(this.tempPos);
        this.clearMask(point);

    }

    touchEndEvent(evt: any) {
        this.tempDrawPoints = [];
        this.calcProgress();

    }

    reset() {
        this.scheduleOnce(() => {
            let mask: Mask = this.maskNode.getComponent(Mask)!;
            mask.getComponent(Graphics).clear();

            let _graphics = this.cardNode.getComponent(Graphics);
            _graphics!.clear();
        }, 0.2);


        this.tempDrawPoints = [];
        this.polygonPointsList = [];
        this.progress.string = '0%';



        let cardNodeContentSize = this.cardNode.getComponent(UITransform)!.contentSize;
        for (let x = 0; x < cardNodeContentSize.width; x += this.calcRectWidth) {
            for (let y = 0; y < cardNodeContentSize.height; y += this.calcRectWidth) {
                this.polygonPointsList.push({
                    rect: new Rect(x - cardNodeContentSize.width / 2,
                        y - cardNodeContentSize.height / 2,
                        this.calcRectWidth,
                        this.calcRectWidth
                    ),
                    isHit: false
                });
            }
        }
    }

    clearMask(pos: Vec3) {
        let mask: Mask = this.maskNode.getComponent(Mask)!;
        let stencil = mask.getComponent(Graphics)!;
        const len = this.tempDrawPoints.length;
        this.tempDrawPoints.push(pos);

        if (len <= 1) {

            stencil.circle(pos.x, pos.y, this.clearLineWidth / 2);
            stencil.fill();


            this.polygonPointsList.forEach((item) => {
                if (item.isHit) return;
                const xFlag = pos.x > item.rect.x && pos.x < item.rect.x + item.rect.width;
                const yFlag = pos.y > item.rect.y && pos.y < item.rect.y + item.rect.height;
                if (xFlag && yFlag) item.isHit = true;
            });
        } else {

            let prevPos = this.tempDrawPoints[len - 2];
            let curPos = this.tempDrawPoints[len - 1];

            stencil.moveTo(prevPos.x, prevPos.y);
            stencil.lineTo(curPos.x, curPos.y);
            stencil.lineWidth = this.clearLineWidth;
            stencil.lineCap = Graphics.LineCap.ROUND;
            stencil.lineJoin = Graphics.LineJoin.ROUND;
            stencil.strokeColor = new Color(255, 255, 255, 255);
            stencil.stroke();

            const prevPosVec2 = new Vec2(prevPos.x, prevPos.y);
            const curPosVec2 = new Vec2(curPos.x, curPos.y);

            this.polygonPointsList.forEach((item) => {
                item.isHit = item.isHit || Intersection.lineRect(prevPosVec2, curPosVec2, item.rect);
            });
        }
    }

    calcProgress() {
        let hitItemCount = 0;
        let ctx = this.cardNode.getComponent(Graphics)!;
        this.polygonPointsList.forEach((item) => {
            if (!item.isHit) return;
            hitItemCount += 1;

            if (!this.calcDebugger) return;
            ctx.rect(item.rect.x, item.rect.y, item.rect.width, item.rect.height);
            ctx.fillColor = new Color(216, 18, 18, 255);
            ctx.fill();
        });

        this.progress.string = `${Math.ceil((hitItemCount / this.polygonPointsList.length) * 100)}%`;
    }

}